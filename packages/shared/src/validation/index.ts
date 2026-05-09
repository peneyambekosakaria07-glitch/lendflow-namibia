// Shared validation schemas using Zod
import { z } from 'zod';
import { NAMIBIA_MOBILE_PREFIXES, LOAN_CONSTRAINTS } from '../constants';

// Phone number validation
export const phoneSchema = z.string().refine(
  (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const prefix = cleaned.startsWith('264') ? cleaned.substring(3, 6) : cleaned.substring(0, 3);
    return NAMIBIA_MOBILE_PREFIXES.includes(prefix as any);
  },
  { message: 'Must be a valid Namibian mobile number (081-085)' }
);

// Loan terms validation
export const loanTermsSchema = z.object({
  principal: z.number().min(LOAN_CONSTRAINTS.MIN_PRINCIPAL).max(LOAN_CONSTRAINTS.MAX_PRINCIPAL),
  annualRate: z.number().min(LOAN_CONSTRAINTS.MIN_INTEREST_RATE).max(LOAN_CONSTRAINTS.MAX_INTEREST_RATE),
  interestType: z.enum(['simple', 'compound']),
  termMonths: z.number().min(LOAN_CONSTRAINTS.MIN_TERM_MONTHS).max(LOAN_CONSTRAINTS.MAX_TERM_MONTHS),
  startDate: z.date(),
  penaltyRate: z.number().optional(),
  gracePeriodDays: z.number().optional(),
});

// Lender registration
export const lenderRegisterSchema = z.object({
  businessName: z.string().min(1).max(255),
  ownerName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: phoneSchema,
  password: z.string().min(8),
  namfisaRegNumber: z.string().optional(),
});

// Borrower KYC
export const borrowerSchema = z.object({
  fullName: z.string().min(1).max(255),
  nationalId: z.string().max(20).optional(),
  phone: phoneSchema,
  email: z.string().email().optional(),
  employmentInfo: z.string().max(255).optional(),
  employerName: z.string().max(255).optional(),
  employerAddress: z.string().max(500).optional(),
  employerPhone: z.string().max(20).optional(),
});

// Payment verification
export const paymentDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  verifiedAmount: z.number().positive().optional(),
  rejectionReason: z.string().optional(),
});

export type LenderRegisterInput = z.infer<typeof lenderRegisterSchema>;
export type BorrowerInput = z.infer<typeof borrowerSchema>;
export type LoanTermsInput = z.infer<typeof loanTermsSchema>;
export type PaymentDecisionInput = z.infer<typeof paymentDecisionSchema>;
