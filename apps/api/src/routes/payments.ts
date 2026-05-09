import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { payments, loans, borrowers, repaymentPlans } from '../db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

const paymentDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  verifiedAmount: z.number().positive().optional(),
  rejectionReason: z.string().optional(),
});

const recordPaymentSchema = z.object({
  loanId: z.string().uuid(),
  repaymentPlanId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money', 'other']).optional(),
  referenceNumber: z.string().optional(),
  depositSlipUrl: z.string().optional(),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List payments
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { loanId, status, page = 1, limit = 20 } = request.query as any;
    const offset = (Number(page) - 1) * Number(limit);
    
    const conditions = [];
    
    if (loanId) {
      conditions.push(eq(payments.loanId, loanId));
    }
    if (status) {
      conditions.push(eq(payments.status, status));
    }
    
    const [paymentList, countResult] = await Promise.all([
      db.query.payments.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        limit: Number(limit),
        offset,
        orderBy: [desc(payments.paidAt)],
        with: { loan: { with: { borrower: true } } },
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(payments),
    ]);
    
    return reply.send({
      payments: paymentList.map(p => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        status: p.status,
        paidAt: p.paidAt,
        borrower: p.loan?.borrower?.fullName,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult[0]?.count || 0,
      },
    });
  });

  // Get pending payments (unverified)
  fastify.get('/pending', async (request: FastifyRequest, reply: FastifyReply) => {
    const pending = await db.query.payments.findMany({
      where: eq(payments.status, 'pending'),
      orderBy: [desc(payments.createdAt)],
      with: { 
        loan: { 
          with: { 
            borrower: true,
            lender: true,
          } 
        } 
      },
    });
    
    // Filter to only this lender's pending payments
    const lenderPending = pending.filter(p => p.loan?.lender?.id === request.user.id);
    
    return reply.send({ payments: lenderPending });
  });

  // Record new payment
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = recordPaymentSchema.parse(request.body);
    
    // Verify loan belongs to lender
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, body.loanId), eq(loans.lenderId, request.user.id)),
    });
    
    if (!loan) {
      return reply.status(400).send({ error: 'Loan not found' });
    }
    
    const [payment] = await db.insert(payments).values({
      loanId: body.loanId,
      repaymentPlanId: body.repaymentPlanId,
      amount: body.amount,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      referenceNumber: body.referenceNumber,
      depositSlipUrl: body.depositSlipUrl,
      status: 'pending',
    }).returning();
    
    return reply.status(201).send({ payment });
  });

  // Verify/reject payment
  fastify.post('/:id/decision', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = paymentDecisionSchema.parse(request.body);
    
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: { 
        loan: { 
          with: { 
            borrower: true,
            repaymentPlans: { where: eq(repaymentPlans.status, 'pending'), orderBy: [asc(repaymentPlans.dueDate)] }
          } 
        } 
      },
    });
    
    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    if (payment.loan?.lenderId !== request.user.id) {
      return reply.status(403).send({ error: 'Not authorized' });
    }
    
    if (body.decision === 'approve') {
      const verifiedAmount = body.verifiedAmount || payment.amount;
      
      // Update payment
      await db.update(payments)
        .set({
          status: 'verified',
          amount: verifiedAmount,
          verifiedBy: request.user.id,
          verifiedAt: new Date(),
        })
        .where(eq(payments.id, id));
      
      // Update repayment plan if linked
      if (payment.repaymentPlanId) {
        const plan = payment.loan.repaymentPlans[0];
        if (plan) {
          const newBalance = plan.balanceAfter - verifiedAmount;
          await db.update(repaymentPlans)
            .set({
              status: verifiedAmount >= plan.amountDue ? 'paid' : 'partial',
              paidAt: verifiedAmount >= plan.amountDue ? new Date() : null,
              balanceAfter: Math.max(0, newBalance),
            })
            .where(eq(repaymentPlans.id, plan.id));
        }
      }
      
      // Check if loan is fully paid
      const remainingPlans = await db.query.repaymentPlans.findMany({
        where: and(eq(repaymentPlans.loanId, payment.loanId), eq(repaymentPlans.status, 'pending')),
      });
      
      if (remainingPlans.length === 0) {
        await db.update(loans)
          .set({ status: 'completed' })
          .where(eq(loans.id, payment.loanId));
      }
      
      return reply.send({ success: true, message: 'Payment verified' });
    } else {
      // Reject
      await db.update(payments)
        .set({
          status: 'rejected',
          verifiedBy: request.user.id,
          verifiedAt: new Date(),
        })
        .where(eq(payments.id, id));
      
      return reply.send({ success: true, message: 'Payment rejected' });
    }
  });
}
