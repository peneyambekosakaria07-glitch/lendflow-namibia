// LendFlow Namibia - Drizzle ORM Schema
// Based on ARCHITECTURE.md approved 2026-05-08

import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const loanStatusEnum = pgEnum('loan_status', [
  'pending',
  'active',
  'completed',
  'overdue',
  'written_off',
]);

export const repaymentStatusEnum = pgEnum('repayment_status', [
  'pending',
  'paid',
  'partial',
  'overdue',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'verified',
  'rejected',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'mobile_money',
  'other',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'national_id',
  'contract',
  'collateral',
  'payslip',
  'other',
]);

export const reminderTypeEnum = pgEnum('reminder_type', [
  '3_days_before',
  'day_of',
  '1_day_after',
  'manual',
]);

export const channelEnum = pgEnum('channel', ['sms', 'whatsapp', 'email']);

export const reminderStatusEnum = pgEnum('reminder_status', [
  'scheduled',
  'sent',
  'failed',
  'cancelled',
]);

// ============================================================================
// TABLES
// ============================================================================

// Lenders (micro-lending business owners)
export const lenders = pgTable('lenders', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).unique().notNull(),
  whatsappOptIn: boolean('whatsapp_opt_in').default(false),
  namfisaRegNumber: varchar('namfisa_reg_number', { length: 50 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Borrowers (individuals taking loans)
export const borrowers = pgTable(
  'borrowers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lenderId: uuid('lender_id')
      .notNull()
      .references(() => lenders.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    nationalId: varchar('national_id', { length: 20 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    employmentInfo: varchar('employment_info', { length: 255 }),
    employerName: varchar('employer_name', { length: 255 }),
    employerAddress: varchar('employer_address', { length: 500 }),
    employerPhone: varchar('employer_phone', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_borrowers_lender_id').on(table.lenderId),
    index('idx_borrowers_phone').on(table.phone),
    index('idx_borrowers_email').on(table.email),
    index('idx_borrowers_national_id').on(table.nationalId),
  ]
);

// Loans (loan origination records)
export const loans = pgTable(
  'loans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lenderId: uuid('lender_id')
      .notNull()
      .references(() => lenders.id, { onDelete: 'cascade' }),
    borrowerId: uuid('borrower_id')
      .notNull()
      .references(() => borrowers.id, { onDelete: 'cascade' }),
    principalAmount: decimal('principal_amount', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    interestRate: decimal('interest_rate', { precision: 5, scale: 4 })
      .notNull()
      .$type<number>(),
    interestType: varchar('interest_type', { length: 20 }).notNull(), // 'simple' | 'compound'
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    termMonths: integer('term_months').notNull(),
    status: loanStatusEnum('status').default('pending'),
    penaltyRate: decimal('penalty_rate', { precision: 5, scale: 4 })
      .default(0.02)
      .$type<number>(),
    gracePeriodDays: integer('grace_period_days').default(3),
    totalInterest: decimal('total_interest', { precision: 15, scale: 2 }).$type<number>(),
    totalRepayment: decimal('total_repayment', { precision: 15, scale: 2 }).$type<number>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_loans_lender_id').on(table.lenderId),
    index('idx_loans_borrower_id').on(table.borrowerId),
    index('idx_loans_status').on(table.status),
    index('idx_loans_end_date').on(table.endDate),
    index('idx_loans_lender_status').on(table.lenderId, table.status),
  ]
);

// Repayment Plans (auto-generated payment schedule)
export const repaymentPlans = pgTable(
  'repayment_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    loanId: uuid('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    installmentNo: integer('installment_no').notNull(),
    dueDate: date('due_date').notNull(),
    amountDue: decimal('amount_due', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    principalPortion: decimal('principal_portion', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    interestPortion: decimal('interest_portion', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    balanceAfter: decimal('balance_after', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    status: repaymentStatusEnum('status').default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_repayment_plan_loan_id').on(table.loanId),
    index('idx_repayment_plan_due_date').on(table.dueDate),
    index('idx_repayment_plan_status').on(table.status),
    index('idx_repayment_plan_loan_status').on(table.loanId, table.status),
  ]
);

// Payments (individual payment records)
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    loanId: uuid('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    repaymentPlanId: uuid('repayment_plan_id').references(() => repaymentPlans.id, {
      onDelete: 'set null',
    }),
    amount: decimal('amount', { precision: 15, scale: 2 })
      .notNull()
      .$type<number>(),
    paymentMethod: paymentMethodEnum('payment_method').default('bank_transfer'),
    referenceNumber: varchar('reference_number', { length: 100 }),
    depositSlipUrl: text('deposit_slip_url'),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow(),
    verifiedBy: uuid('verified_by').references(() => lenders.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    status: paymentStatusEnum('status').default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_payments_loan_id').on(table.loanId),
    index('idx_payments_repayment_plan_id').on(table.repaymentPlanId),
    index('idx_payments_status').on(table.status),
    index('idx_payments_paid_at').on(table.paidAt),
    index('idx_payments_verified_at').on(table.verifiedAt),
  ]
);

// Documents (uploaded files for KYC, contracts, collateral)
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    borrowerId: uuid('borrower_id').references(() => borrowers.id, { onDelete: 'cascade' }),
    loanId: uuid('loan_id').references(() => loans.id, { onDelete: 'cascade' }),
    type: documentTypeEnum('type').notNull(),
    fileUrl: text('file_url').notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => lenders.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_documents_borrower_id').on(table.borrowerId),
    index('idx_documents_loan_id').on(table.loanId),
    index('idx_documents_type').on(table.type),
  ]
);

// Reminder Logs (automated message delivery tracking)
export const reminderLogs = pgTable(
  'reminder_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    loanId: uuid('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'cascade' }),
    repaymentPlanId: uuid('repayment_plan_id').references(() => repaymentPlans.id, {
      onDelete: 'cascade',
    }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    reminderType: reminderTypeEnum('reminder_type').notNull(),
    channel: channelEnum('channel').notNull(),
    recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
    messageBody: text('message_body'),
    twilioMessageSid: varchar('twilio_message_sid', { length: 100 }),
    status: reminderStatusEnum('status').default('scheduled'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_reminder_logs_scheduled').on(table.scheduledFor),
    index('idx_reminder_logs_status').on(table.status),
    index('idx_reminder_logs_loan_id').on(table.loanId),
    index('idx_reminder_logs_channel').on(table.channel),
  ]
);

// Lender Settings (lender-specific configuration)
export const lenderSettings = pgTable(
  'lender_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lenderId: uuid('lender_id')
      .unique()
      .notNull()
      .references(() => lenders.id, { onDelete: 'cascade' }),
    reminderDaysBefore: integer('reminder_days_before').default(3),
    reminderDayOf: boolean('reminder_day_of').default(true),
    reminderDaysAfter: integer('reminder_days_after').default(1),
    penaltyRate: decimal('penalty_rate', { precision: 5, scale: 4 })
      .default(0.02)
      .$type<number>(),
    gracePeriodDays: integer('grace_period_days').default(3),
    defaultInterestRate: decimal('default_interest_rate', { precision: 5, scale: 4 })
      .default(0.1)
      .$type<number>(),
    maxLoansPerBorrower: integer('max_loans_per_borrower').default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_lender_settings_lender_id').on(table.lenderId)]
);

// Reminder Configs (message templates per lender)
export const reminderConfigs = pgTable(
  'reminder_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lenderId: uuid('lender_id')
      .notNull()
      .references(() => lenders.id, { onDelete: 'cascade' }),
    reminderType: reminderTypeEnum('reminder_type').notNull(),
    channel: channelEnum('channel').notNull(),
    templateText: text('template_text').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_reminder_configs_lender_id').on(table.lenderId),
    uniqueIndex('idx_reminder_configs_lender_type_channel').on(
      table.lenderId,
      table.reminderType,
      table.channel
    ),
  ]
);

// Refresh Tokens (for JWT auth)
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lenderId: uuid('lender_id')
      .notNull()
      .references(() => lenders.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_refresh_tokens_lender_id').on(table.lenderId),
    index('idx_refresh_tokens_token_hash').on(table.tokenHash),
  ]
);

// Audit Log (for compliance tracking)
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'),
    actorType: varchar('actor_type', { length: 50 }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    oldValues: text('old_values'), // JSON
    newValues: text('new_values'), // JSON
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_entity').on(table.entityType, table.entityId),
    index('idx_audit_logs_actor').on(table.actorId, table.actorType),
    index('idx_audit_logs_created_at').on(table.createdAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const lendersRelations = relations(lenders, ({ many, one }) => ({
  borrowers: many(borrowers),
  loans: many(loans),
  lenderSettings: one(lenderSettings),
  refreshTokens: many(refreshTokens),
}));

export const borrowersRelations = relations(borrowers, ({ one, many }) => ({
  lender: one(lenders, { fields: [borrowers.lenderId], references: [lenders.id] }),
  loans: many(loans),
  documents: many(documents),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  lender: one(lenders, { fields: [loans.lenderId], references: [lenders.id] }),
  borrower: one(borrowers, { fields: [loans.borrowerId], references: [borrowers.id] }),
  repaymentPlans: many(repaymentPlans),
  payments: many(payments),
  documents: many(documents),
  reminderLogs: many(reminderLogs),
}));

export const repaymentPlansRelations = relations(repaymentPlans, ({ one, many }) => ({
  loan: one(loans, { fields: [repaymentPlans.loanId], references: [loans.id] }),
  payments: many(payments),
  reminderLogs: many(reminderLogs),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  loan: one(loans, { fields: [payments.loanId], references: [loans.id] }),
  repaymentPlan: one(repaymentPlans, {
    fields: [payments.repaymentPlanId],
    references: [repaymentPlans.id],
  }),
  verifiedByLender: one(lenders, { fields: [payments.verifiedBy], references: [lenders.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  borrower: one(borrowers, { fields: [documents.borrowerId], references: [borrowers.id] }),
  loan: one(loans, { fields: [documents.loanId], references: [loans.id] }),
  uploadedByLender: one(lenders, { fields: [documents.uploadedBy], references: [lenders.id] }),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  loan: one(loans, { fields: [reminderLogs.loanId], references: [loans.id] }),
  repaymentPlan: one(repaymentPlans, {
    fields: [reminderLogs.repaymentPlanId],
    references: [repaymentPlans.id],
  }),
}));

export const lenderSettingsRelations = relations(lenderSettings, ({ one }) => ({
  lender: one(lenders, { fields: [lenderSettings.lenderId], references: [lenders.id] }),
}));

export const reminderConfigsRelations = relations(reminderConfigs, ({ one }) => ({
  lender: one(lenders, { fields: [reminderConfigs.lenderId], references: [lenders.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  lender: one(lenders, { fields: [refreshTokens.lenderId], references: [lenders.id] }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Lender = typeof lenders.$inferSelect;
export type NewLender = typeof lenders.$inferInsert;
export type Borrower = typeof borrowers.$inferSelect;
export type NewBorrower = typeof borrowers.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type RepaymentPlan = typeof repaymentPlans.$inferSelect;
export type NewRepaymentPlan = typeof repaymentPlans.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type NewReminderLog = typeof reminderLogs.$inferInsert;
export type LenderSetting = typeof lenderSettings.$inferSelect;
export type NewLenderSetting = typeof lenderSettings.$inferInsert;
export type ReminderConfig = typeof reminderConfigs.$inferSelect;
export type NewReminderConfig = typeof reminderConfigs.$inferInsert;
