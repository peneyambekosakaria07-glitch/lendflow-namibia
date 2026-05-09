// Shared constants for LendFlow Namibia

export const NAMFISA_RATE_CAPS = {
  SMALL_LOAN: { maxAmount: 1000, maxAPR: 0.36 },
  MEDIUM_LOAN: { maxAmount: 5000, maxAPR: 0.32 },
  LARGE_LOAN: { maxAmount: 10000, maxAPR: 0.28 },
  DEFAULT: { maxAPR: 0.24 },
} as const;

export const LOAN_CONSTRAINTS = {
  MIN_PRINCIPAL: 100,
  MAX_PRINCIPAL: 50000,
  MIN_TERM_MONTHS: 1,
  MAX_TERM_MONTHS: 36,
  MIN_INTEREST_RATE: 0,
  MAX_INTEREST_RATE: 0.50,
  MIN_GRACE_PERIOD: 0,
  MAX_GRACE_PERIOD: 14,
  MIN_PENALTY_RATE: 0,
  MAX_PENALTY_RATE: 0.05,
} as const;

export const NAMIBIA_MOBILE_PREFIXES = ['081', '082', '083', '084', '085'] as const;

export const TWILIO_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 2000,
  rateLimitPerSecond: 1,
  rateLimitPerMinute: 30,
} as const;

export const REMINDER_TYPES = {
  THREE_DAYS_BEFORE: '3_days_before',
  DAY_OF: 'day_of',
  ONE_DAY_AFTER: '1_day_after',
  MANUAL: 'manual',
} as const;

export const CHANNELS = {
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
} as const;

export const LOAN_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  WRITTEN_OFF: 'written_off',
} as const;

export const REPAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;
