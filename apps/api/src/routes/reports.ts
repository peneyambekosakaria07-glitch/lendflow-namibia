import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { loans, borrowers, repaymentPlans, payments } from '../db/schema';
import { eq, and, sql, desc, gte, lte, lt } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Dashboard metrics
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const lenderId = request.user.id;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    // Active loans count and capital at risk
    const activeLoans = await db.query.loans.findMany({
      where: and(
        eq(loans.lenderId, lenderId),
        eq(loans.status, 'active')
      ),
    });
    
    const overdueLoans = activeLoans.filter(l => l.status === 'overdue');
    const capitalAtRisk = overdueLoans.reduce((sum, l) => sum + Number(l.principalAmount), 0);
    
    // Active borrowers count
    const activeBorrowers = await db.select({
      count: sql<number>`count(distinct ${borrowers.id})`,
    })
      .from(borrowers)
      .innerJoin(loans, eq(loans.borrowerId, borrowers.id))
      .where(and(
        eq(loans.lenderId, lenderId),
        eq(loans.status, 'active')
      ));
    
    // Expected collections this month (sum of pending repayment plan amounts due this month)
    const expectedCollections = await db.select({
      sum: sql<number>`coalesce(sum(${repaymentPlans.amountDue}), 0)`,
    })
      .from(repaymentPlans)
      .innerJoin(loans, eq(loans.id, repaymentPlans.loanId))
      .where(and(
        eq(loans.lenderId, lenderId),
        gte(repaymentPlans.dueDate, monthStart),
        lte(repaymentPlans.dueDate, monthEnd),
        eq(repaymentPlans.status, 'pending')
      ));
    
    // Late payment ratio
    const latePaymentRatio = activeLoans.length > 0
      ? (overdueLoans.length / activeLoans.length) * 100
      : 0;
    
    // Collection rate this month (verified payments / expected)
    const verifiedPayments = await db.select({
      sum: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
      .from(payments)
      .innerJoin(loans, eq(loans.id, payments.loanId))
      .where(and(
        eq(loans.lenderId, lenderId),
        eq(payments.status, 'verified'),
        gte(payments.verifiedAt, monthStart),
        lte(payments.verifiedAt, monthEnd)
      ));
    
    const collectionRate = expectedCollections[0]?.sum > 0
      ? (Number(verifiedPayments[0]?.sum || 0) / Number(expectedCollections[0]?.sum)) * 100
      : 0;
    
    // Average loan size
    const averageLoanSize = activeLoans.length > 0
      ? activeLoans.reduce((sum, l) => sum + Number(l.principalAmount), 0) / activeLoans.length
      : 0;
    
    return reply.send({
      capitalAtRisk,
      expectedCollectionsThisMonth: Number(expectedCollections[0]?.sum || 0),
      latePaymentRatio: Math.round(latePaymentRatio * 10) / 10,
      activeBorrowers: activeBorrowers[0]?.count || 0,
      activeLoans: activeLoans.length,
      averageLoanSize: Math.round(averageLoanSize),
      collectionRateThisMonth: Math.round(collectionRate * 10) / 10,
      // Changes from last month (placeholder - would need historical data)
      capitalAtRiskChange: 0,
      latePaymentRatioChange: 0,
      collectionRateChange: 0,
    });
  });

  // Capital at risk breakdown
  fastify.get('/capital-at-risk', async (request: FastifyRequest, reply: FastifyReply) => {
    const overdueLoans = await db.query.loans.findMany({
      where: and(
        eq(loans.lenderId, request.user.id),
        eq(loans.status, 'overdue')
      ),
      with: { borrower: true },
    });
    
    const breakdown = overdueLoans.map(loan => ({
      borrower: loan.borrower.fullName,
      principal: Number(loan.principalAmount),
      interestRate: Number(loan.interestRate),
      status: loan.status,
      endDate: loan.endDate,
    }));
    
    const total = breakdown.reduce((sum, l) => sum + l.principal, 0);
    
    return reply.send({ breakdown, total });
  });

  // Expected collections (month)
  fastify.get('/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    const { month } = request.query as any;
    const targetMonth = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    const collections = await db.select({
      borrowerName: borrowers.fullName,
      loanId: loans.id,
      amountDue: repaymentPlans.amountDue,
      dueDate: repaymentPlans.dueDate,
      status: repaymentPlans.status,
    })
      .from(repaymentPlans)
      .innerJoin(loans, eq(loans.id, repaymentPlans.loanId))
      .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
      .where(and(
        eq(loans.lenderId, request.user.id),
        gte(repaymentPlans.dueDate, monthStart),
        lte(repaymentPlans.dueDate, monthEnd)
      ));
    
    return reply.send({ collections });
  });

  // Late payment ratio
  fastify.get('/late-payment-ratio', async (request: FastifyRequest, reply: FastifyReply) => {
    const activeLoans = await db.query.loans.findMany({
      where: and(
        eq(loans.lenderId, request.user.id),
        eq(loans.status, 'active')
      ),
    });
    
    const overdueCount = activeLoans.filter(l => l.status === 'overdue').length;
    const ratio = activeLoans.length > 0 ? (overdueCount / activeLoans.length) * 100 : 0;
    
    return reply.send({
      totalActiveLoans: activeLoans.length,
      overdueLoans: overdueCount,
      latePaymentRatio: Math.round(ratio * 10) / 10,
    });
  });

  // Export loans to CSV
  fastify.get('/export/loans', async (request: FastifyRequest, reply: FastifyReply) => {
    const allLoans = await db.query.loans.findMany({
      where: eq(loans.lenderId, request.user.id),
      with: { borrower: true },
      orderBy: [desc(loans.createdAt)],
    });
    
    const csv = [
      ['Loan ID', 'Borrower', 'Principal', 'Interest Rate', 'Term', 'Status', 'Start Date', 'End Date'].join(','),
      ...allLoans.map(l => [
        l.id,
        l.borrower.fullName,
        l.principalAmount,
        l.interestRate,
        l.termMonths,
        l.status,
        l.startDate,
        l.endDate,
      ].join(',')),
    ].join('\n');
    
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="loans.csv"');
    return reply.send(csv);
  });
}
