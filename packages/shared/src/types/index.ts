// Shared type definitions for LendFlow Namibia

export interface Lender {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  namfisaRegNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Borrower {
  id: string;
  lenderId: string;
  fullName: string;
  nationalId?: string;
  phone: string;
  email?: string;
  employmentInfo?: string;
  employerName?: string;
  employerAddress?: string;
  employerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  lenderId: string;
  borrowerId: string;
  principalAmount: number;
  interestRate: number;
  interestType: 'simple' | 'compound';
  startDate: Date;
  endDate: Date;
  termMonths: number;
  status: LoanStatus;
  penaltyRate: number;
  gracePeriodDays: number;
  totalInterest: number;
  totalRepayment: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LoanStatus = 'pending' | 'active' | 'completed' | 'overdue' | 'written_off';

export interface RepaymentPlan {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: Date;
  amountDue: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfter: number;
  status: RepaymentStatus;
  paidAt?: Date;
  createdAt: Date;
}

export type RepaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export interface Payment {
  id: string;
  loanId: string;
  repaymentPlanId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  depositSlipUrl?: string;
  paidAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  status: PaymentStatus;
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'other';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface Document {
  id: string;
  borrowerId?: string;
  loanId?: string;
  type: DocumentType;
  fileUrl: string;
  originalName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt: Date;
}

export type DocumentType = 'national_id' | 'contract' | 'collateral' | 'payslip' | 'other';

export interface ReminderLog {
  id: string;
  loanId: string;
  repaymentPlanId?: string;
  scheduledFor: Date;
  reminderType: ReminderType;
  channel: Channel;
  recipientPhone: string;
  messageBody?: string;
  twilioMessageSid?: string;
  status: ReminderStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export type ReminderType = '3_days_before' | 'day_of' | '1_day_after' | 'manual';
export type Channel = 'sms' | 'whatsapp' | 'email';
export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface LenderSetting {
  id: string;
  lenderId: string;
  reminderDaysBefore: number;
  reminderDayOf: boolean;
  reminderDaysAfter: number;
  penaltyRate: number;
  gracePeriodDays: number;
  defaultInterestRate: number;
  maxLoansPerBorrower: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  capitalAtRisk: number;
  expectedCollectionsThisMonth: number;
  latePaymentRatio: number;
  activeBorrowers: number;
  activeLoans: number;
  averageLoanSize: number;
  collectionRateThisMonth: number;
  capitalAtRiskChange: number;
  latePaymentRatioChange: number;
  collectionRateChange: number;
}
