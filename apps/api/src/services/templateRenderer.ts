// Template Renderer Service

export interface ReminderTemplateData {
  borrowerName: string;
  amount: string;
  dueDate: string;
}

const templates = {
  reminder_3_days: {
    sms: (d: ReminderTemplateData) =>
      `Hi ${d.borrowerName}, this is a reminder that your LendFlow loan payment of N$${d.amount} is due in 3 days (${d.dueDate}). Stay on track with your payments!`,
    whatsapp: (d: ReminderTemplateData) =>
      `💰 *LendFlow Payment Reminder*\n\nHi ${d.borrowerName},\n\nYour loan payment of *N$${d.amount}* is due in *3 days* (${d.dueDate}).\n\n💳 Make payment now to avoid any issues.\n\nQuestions? Reply to this message or call your lender.`,
  },
  reminder_due_today: {
    sms: (d: ReminderTemplateData) =>
      `Hi ${d.borrowerName}, your LendFlow loan payment of N$${d.amount} is due TODAY. Please make payment to avoid late fees.`,
    whatsapp: (d: ReminderTemplateData) =>
      `⚠️ *LendFlow Payment Due TODAY*\n\nHi ${d.borrowerName},\n\nYour payment of *N$${d.amount}* is due *TODAY*.\n\nPlease make payment as soon as possible.`,
  },
  reminder_1_day_after: {
    sms: (d: ReminderTemplateData) =>
      `Hi ${d.borrowerName}, your LendFlow payment of N$${d.amount} was due yesterday. Please pay immediately to avoid penalties. Questions? Call your lender.`,
    whatsapp: (d: ReminderTemplateData) =>
      `🚨 *LendFlow Payment OVERDUE*\n\n\nHi ${d.borrowerName},\n\nYour payment of *N$${d.amount}* was due yesterday.\n\nPlease pay immediately to avoid late fees.\n\nNeed assistance? Reply to this message.`,
  },
  proof_of_payment_received: {
    sms: (d: ReminderTemplateData) =>
      `Thanks ${d.borrowerName}! We've received your payment proof. Your lender will verify shortly.`,
    whatsapp: (d: ReminderTemplateData) =>
      `✅ *Payment Proof Received*\n\nHi ${d.borrowerName},\n\nThanks! We've received your payment proof.\n\nYour lender will verify shortly and update your account.`,
  },
  payment_confirmed: {
    sms: (d: ReminderTemplateData) =>
      `Hi ${d.borrowerName}, your payment of N$${d.amount} has been confirmed. Thank you!`,
    whatsapp: (d: ReminderTemplateData) =>
      `✅ *Payment Confirmed*\n\nHi ${d.borrowerName},\n\nYour payment of *N$${d.amount}* has been confirmed.\n\nThank you for your prompt payment! 💚`,
  },
  payment_rejected: {
    sms: (d: ReminderTemplateData) =>
      `Hi ${d.borrowerName}, we couldn't verify your payment. Please resend a clearer photo of your deposit slip.`,
    whatsapp: (d: ReminderTemplateData) =>
      `❌ *Payment Not Verified*\n\nHi ${d.borrowerName},\n\nWe couldn't verify your payment proof.\n\nPlease resend a clearer photo of your bank deposit slip.`,
  },
};

type TemplateType = keyof typeof templates;

export function renderReminderTemplate(
  type: TemplateType,
  channel: 'sms' | 'whatsapp',
  data: ReminderTemplateData
): string {
  return templates[type][channel](data);
}
