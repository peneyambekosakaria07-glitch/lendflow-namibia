import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { borrowers, loans, documents } from '../db/schema';
import { eq, and, like, sql, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { InterestCalculator } from '../services/interestCalculator';

const createLoanSchema = z.object({
  borrowerId: z.string().uuid(),
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  interestType: z.enum(['simple', 'compound']),
  termMonths: z.number().min(1).max(36),
  startDate: z.string().transform(s => new Date(s)),
  penaltyRate: z.number().min(0).max(0.1).optional(),
  gracePeriodDays: z.number().min(0).max(14).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'active', 'completed', 'overdue', 'written_off']).optional(),
});

export async function loanRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List loans
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = querySchema.parse(request.query);
    const { page, limit, status } = query;
    const offset = (page - 1) * limit;
    
    const conditions = [eq(loans.lenderId, request.user.id)];
    
    if (status) {
      conditions.push(eq(loans.status, status));
    }
    
    const [loansList, countResult] = await Promise.all([
      db.query.loans.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: [desc(loans.createdAt)],
        with: { borrower: true },
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(and(...conditions)),
    ]);
    
    return reply.send({
      loans: loansList.map(l => ({
        id: l.id,
        borrower: { id: l.borrower.id, fullName: l.borrower.fullName },
        principalAmount: l.principalAmount,
        interestRate: l.interestRate,
        interestType: l.interestType,
        termMonths: l.termMonths,
        status: l.status,
        totalRepayment: l.totalRepayment,
        startDate: l.startDate,
        endDate: l.endDate,
        createdAt: l.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        pages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  });

  // Get single loan with repayment plan
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.lenderId, request.user.id)),
      with: { borrower: true, repaymentPlans: { orderBy: [asc(repaymentPlans.dueDate)] } },
    });
    
    if (!loan) {
      return reply.status(404).send({ error: 'Loan not found' });
    }
    
    return reply.send({ loan });
  });

  // Create loan
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createLoanSchema.parse(request.body);
    
    // Verify borrower belongs to lender
    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, body.borrowerId),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!borrower) {
      return reply.status(400).send({ error: 'Borrower not found' });
    }
    
    // Calculate repayment schedule
    const terms = {
      principal: body.principal,
      annualRate: body.annualRate,
      interestType: body.interestType as 'simple' | 'compound',
      termMonths: body.termMonths,
      startDate: body.startDate,
      penaltyRate: body.penaltyRate ?? 0.02,
      gracePeriodDays: body.gracePeriodDays ?? 3,
    };
    
    const { entries, summary } = InterestCalculator.generateRepaymentSchedule(terms);
    
    // Calculate end date
    const endDate = new Date(body.startDate);
    endDate.setMonth(endDate.getMonth() + body.termMonths);
    
    // Create loan
    const [loan] = await db.insert(loans).values({
      lenderId: request.user.id,
      borrowerId: body.borrowerId,
      principalAmount: body.principal,
      interestRate: body.annualRate,
      interestType: body.interestType,
      startDate: body.startDate,
      endDate,
      termMonths: body.termMonths,
      status: 'pending',
      penaltyRate: body.penaltyRate ?? 0.02,
      gracePeriodDays: body.gracePeriodDays ?? 3,
      totalInterest: summary.totalInterest,
      totalRepayment: summary.totalRepayment,
    }).returning();
    
    // Create repayment plan entries
    await db.insert(repaymentPlans).values(
      entries.map(entry => ({
        loanId: loan.id,
        installmentNo: entry.installmentNo,
        dueDate: entry.dueDate,
        amountDue: entry.amountDue,
        principalPortion: entry.principalPortion,
        interestPortion: entry.interestPortion,
        balanceAfter: entry.remainingBalance,
        status: 'pending',
      }))
    );
    
    return reply.status(201).send({ loan, summary });
  });

  // Get repayment schedule
  fastify.get('/:id/repayment-plan', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.lenderId, request.user.id)),
    });
    
    if (!loan) {
      return reply.status(404).send({ error: 'Loan not found' });
    }
    
    const plan = await db.query.repaymentPlans.findMany({
      where: eq(repaymentPlans.loanId, id),
      orderBy: [asc(repaymentPlans.installmentNo)],
    });
    
    return reply.send({ repaymentPlan: plan });
  });

  // Activate loan
  fastify.post('/:id/activate', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.lenderId, request.user.id)),
    });
    
    if (!loan) {
      return reply.status(404).send({ error: 'Loan not found' });
    }
    
    if (loan.status !== 'pending') {
      return reply.status(400).send({ error: 'Can only activate pending loans' });
    }
    
    const [updated] = await db.update(loans)
      .set({ status: 'active' })
      .where(eq(loans.id, id))
      .returning();
    
    return reply.send({ loan: updated });
  });

  // Close/complete loan
  fastify.post('/:id/close', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.lenderId, request.user.id)),
    });
    
    if (!loan) {
      return reply.status(404).send({ error: 'Loan not found' });
    }
    
    const [updated] = await db.update(loans)
      .set({ status: 'completed' })
      .where(eq(loans.id, id))
      .returning();
    
    return reply.send({ loan: updated });
  });
}

import { repaymentPlans } from '../db/schema';
