import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { reminderLogs, loans, borrowers, lenderSettings } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { renderReminderTemplate } from '../services/templateRenderer';
import { twilioService } from '../services/twilio';

const updateReminderConfigSchema = z.object({
  reminderDaysBefore: z.number().min(0).max(14).optional(),
  reminderDayOf: z.boolean().optional(),
  reminderDaysAfter: z.number().min(0).max(14).optional(),
});

export async function reminderRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get reminder logs for a loan
  fastify.get('/loans/:loanId', async (request: FastifyRequest<{ Params: { loanId: string } }>, reply: FastifyReply) => {
    const { loanId } = request.params;
    
    const logs = await db.query.reminderLogs.findMany({
      where: eq(reminderLogs.loanId, loanId),
      orderBy: [desc(reminderLogs.scheduledFor)],
    });
    
    return reply.send({ logs });
  });

  // Get reminder configuration
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const config = await db.query.lenderSettings.findFirst({
      where: eq(lenderSettings.lenderId, request.user.id),
    });
    
    if (!config) {
      return reply.send({
        reminderDaysBefore: 3,
        reminderDayOf: true,
        reminderDaysAfter: 1,
        penaltyRate: 0.02,
        gracePeriodDays: 3,
      });
    }
    
    return reply.send({
      reminderDaysBefore: config.reminderDaysBefore,
      reminderDayOf: config.reminderDayOf,
      reminderDaysAfter: config.reminderDaysAfter,
      penaltyRate: config.penaltyRate,
      gracePeriodDays: config.gracePeriodDays,
    });
  });

  // Update reminder configuration
  fastify.put('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = updateReminderConfigSchema.parse(request.body);
    
    const existing = await db.query.lenderSettings.findFirst({
      where: eq(lenderSettings.lenderId, request.user.id),
    });
    
    if (existing) {
      await db.update(lenderSettings)
        .set(body)
        .where(eq(lenderSettings.lenderId, request.user.id));
    } else {
      await db.insert(lenderSettings).values({
        lenderId: request.user.id,
        ...body,
      });
    }
    
    return reply.send({ success: true });
  });

  // Send test reminder
  fastify.post('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const { borrowerId, reminderType, channel } = request.body as any;
    
    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, borrowerId),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!borrower) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    const message = renderReminderTemplate(reminderType, channel, {
      borrowerName: borrower.fullName,
      amount: '1,000.00',
      dueDate: '15 June 2026',
    });
    
    try {
      const result = await twilioService.sendMessage({
        to: borrower.phone,
        body: message,
        channel,
      });
      
      return reply.send({ success: true, sid: result.sid });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });
}
