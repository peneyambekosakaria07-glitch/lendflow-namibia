// BullMQ Reminder Scheduler - Cron job for sending payment reminders
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { db } from '../db';
import { loans, borrowers, lenderSettings } from '../db/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import { twilioService } from '../services/twilio';
import { renderReminderTemplate, renderOverdueTemplate } from '../services/templateRenderer';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const reminderQueue = new Queue('payment-reminders', { connection });

// Schedule reminder jobs for a loan
export async function scheduleRemindersForLoan(loanId: string, firstPaymentDate: Date) {
  const reminderDays = [-3, 0, 1]; // 3 days before, day of, 1 day after
  
  for (const daysOffset of reminderDays) {
    const reminderDate = new Date(firstPaymentDate);
    reminderDate.setDate(reminderDate.getDate() + daysOffset);
    
    if (reminderDate > new Date()) {
      const delayMs = reminderDate.getTime() - Date.now();
      
      await reminderQueue.add(
        `reminder-${loanId}-${daysOffset}`,
        { loanId, daysOffset, type: daysOffset === -3 ? 'advance' : daysOffset === 0 ? 'due' : 'followup' },
        { delay: delayMs, jobId: `reminder-${loanId}-${daysOffset}` }
      );
    }
  }
}

// Check and send overdue notices (runs daily)
export async function checkOverdueLoans() {
  const today = new Date();
  const gracePeriodDays = 3; // configurable grace period
  
  const overdueLoans = await db
    .select()
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(
      and(
        eq(loans.status, 'active'),
        lte(loans.nextPaymentDate, today)
      )
    );
  
  for (const loan of overdueLoans) {
    const daysLate = Math.floor(
      (today.getTime() - new Date(loan.loans.nextPaymentDate!).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysLate >= gracePeriodDays) {
      await reminderQueue.add(
        `overdue-${loan.loans.id}`,
        { loanId: loan.loans.id, daysLate, type: 'overdue' },
        { jobId: `overdue-${loan.loans.id}` }
      );
    }
  }
}

// Process reminder jobs
const reminderWorker = new Worker(
  'payment-reminders',
  async (job: Job) => {
    const { loanId, type } = job.data;
    
    const loanData = await db
      .select()
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(eq(loans.id, loanId))
      .limit(1);
    
    if (!loanData.length) return;
    
    const { loans: loan, borrowers: borrower } = loanData[0];
    const phone = twilioService.formatNamibiaNumber(borrower.phone);
    
    let message: string;
    if (type === 'overdue') {
      message = renderOverdueTemplate(loan, borrower, job.data.daysLate);
    } else {
      message = renderReminderTemplate(loan, borrower, type);
    }
    
    await twilioService.send(phone, message, 'sms');
    console.log(`[ReminderScheduler] Sent ${type} reminder for loan ${loanId}`);
  },
  { connection, concurrency: 5 }
);

reminderWorker.on('failed', (job, err) => {
  console.error(`[ReminderScheduler] Job ${job?.id} failed:`, err.message);
});

// Cron: check overdue loans every day at 8am
let cronInterval: NodeJS.Timeout | null = null;

export const reminderScheduler = {
  start: () => {
    // Check overdue loans every minute (in production, use proper cron)
    cronInterval = setInterval(checkOverdueLoans, 60 * 1000);
    console.log('[ReminderScheduler] Started');
  },
  stop: () => {
    if (cronInterval) clearInterval(cronInterval);
    reminderWorker.close();
  },
};