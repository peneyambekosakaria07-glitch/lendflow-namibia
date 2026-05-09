// Interest Calculator Service - extracted from INTEREST_ENGINE.md

export interface LoanTerms {
  principal: number;
  annualRate: number;
  interestType: 'simple' | 'compound';
  termMonths: number;
  startDate: Date;
  penaltyRate?: number;
  gracePeriodDays?: number;
}

export interface RepaymentScheduleEntry {
  installmentNo: number;
  dueDate: Date;
  amountDue: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  isOverdue: boolean;
  penaltyAmount: number;
}

export interface LoanSummary {
  principal: number;
  totalInterest: number;
  totalRepayment: number;
  monthlyPayment: number;
  effectiveAPR: number;
  totalPenaltyCeiling: number;
}

export class InterestCalculator {
  static calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    termMonths: number
  ): number {
    if (monthlyRate === 0) {
      return principal / termMonths;
    }
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
    return principal * (numerator / denominator);
  }

  static generateRepaymentSchedule(terms: LoanTerms): {
    entries: RepaymentScheduleEntry[];
    summary: LoanSummary;
  } {
    const {
      principal,
      annualRate,
      interestType,
      termMonths,
      startDate,
    } = terms;

    const monthlyRate = annualRate / 12;
    const entries: RepaymentScheduleEntry[] = [];
    let runningBalance = principal;

    let totalInterest: number;
    if (interestType === 'simple') {
      const timeInYears = termMonths / 12;
      totalInterest = principal * annualRate * timeInYears;
    } else {
      totalInterest = principal * (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    const totalRepayment = principal + totalInterest;
    const monthlyPayment = this.calculateMonthlyPayment(principal, monthlyRate, termMonths);

    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestPortion = runningBalance * monthlyRate;
      const principalPortion = monthlyPayment - interestPortion;
      runningBalance = Math.max(0, runningBalance - principalPortion);

      entries.push({
        installmentNo: i,
        dueDate,
        amountDue: Math.round(monthlyPayment * 100) / 100,
        principalPortion: Math.round(principalPortion * 100) / 100,
        interestPortion: Math.round(interestPortion * 100) / 100,
        remainingBalance: Math.round(runningBalance * 100) / 100,
        isOverdue: false,
        penaltyAmount: 0,
      });
    }

    const effectiveAPR = Math.pow(1 + annualRate / 12, 12) - 1;

    const summary: LoanSummary = {
      principal,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      effectiveAPR: Math.round(effectiveAPR * 10000) / 10000,
      totalPenaltyCeiling: totalRepayment * 0.5,
    };

    return { entries, summary };
  }

  static calculatePenalty(
    outstandingAmount: number,
    daysOverdue: number,
    dailyPenaltyRate: number,
    gracePeriodDays: number = 3
  ): { daysOverdue: number; chargeableDays: number; penaltyAmount: number; gracePeriodDays: number } {
    if (daysOverdue <= gracePeriodDays) {
      return { daysOverdue, chargeableDays: 0, penaltyAmount: 0, gracePeriodDays };
    }

    const chargeableDays = daysOverdue - gracePeriodDays;
    const penaltyAmount = outstandingAmount * dailyPenaltyRate * chargeableDays;

    return {
      daysOverdue,
      chargeableDays,
      penaltyAmount: Math.round(penaltyAmount * 100) / 100,
      gracePeriodDays,
    };
  }
}
