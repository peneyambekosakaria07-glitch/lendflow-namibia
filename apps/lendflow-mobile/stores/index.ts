// Zustand stores for LendFlow Namibia
import { create } from 'zustand';
import { authApi, setStoredToken, DashboardMetrics, Borrower, Loan, Payment } from '../services/api';

// Auth Store
interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken, lender } = await authApi.login(email, password);
      await setStoredToken(accessToken);
      set({ user: lender, token: accessToken, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken, lender } = await authApi.register(data);
      await setStoredToken(accessToken);
      set({ user: lender, token: accessToken, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  logout: () => {
    setStoredToken('');
    set({ user: null, token: null });
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.me();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

// Dashboard Store
interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  fetchMetrics: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  isLoading: false,
  error: null,
  
  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await reportsApi.getDashboard();
      set({ metrics, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

// Borrowers Store
interface BorrowersState {
  borrowers: Borrower[];
  selectedBorrower: Borrower | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; total: number; pages: number };
  
  fetchBorrowers: (params?: any) => Promise<void>;
  createBorrower: (data: any) => Promise<void>;
  updateBorrower: (id: string, data: any) => Promise<void>;
  deleteBorrower: (id: string) => Promise<void>;
  selectBorrower: (borrower: Borrower | null) => void;
}

export const useBorrowersStore = create<BorrowersState>((set) => ({
  borrowers: [],
  selectedBorrower: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, total: 0, pages: 0 },
  
  fetchBorrowers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { borrowers, pagination } = await borrowersApi.list(params);
      set({ borrowers, pagination, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  createBorrower: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { borrower } = await borrowersApi.create(data);
      set((state) => ({
        borrowers: [borrower, ...state.borrowers],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  updateBorrower: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { borrower } = await borrowersApi.update(id, data);
      set((state) => ({
        borrowers: state.borrowers.map((b) => (b.id === id ? borrower : b)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  deleteBorrower: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await borrowersApi.delete(id);
      set((state) => ({
        borrowers: state.borrowers.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  selectBorrower: (borrower) => set({ selectedBorrower: borrower }),
}));

// Loans Store
interface LoansState {
  loans: Loan[];
  selectedLoan: Loan | null;
  repaymentPlan: any[];
  isLoading: boolean;
  error: string | null;
  
  fetchLoans: (params?: any) => Promise<void>;
  createLoan: (data: any) => Promise<Loan>;
  activateLoan: (id: string) => Promise<void>;
  closeLoan: (id: string) => Promise<void>;
  selectLoan: (loan: Loan | null) => void;
  fetchRepaymentPlan: (loanId: string) => Promise<void>;
}

export const useLoansStore = create<LoansState>((set) => ({
  loans: [],
  selectedLoan: null,
  repaymentPlan: [],
  isLoading: false,
  error: null,
  
  fetchLoans: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { loans } = await loansApi.list(params);
      set({ loans, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  createLoan: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { loan } = await loansApi.create(data);
      set((state) => ({
        loans: [loan, ...state.loans],
        isLoading: false,
      }));
      return loan;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
  
  activateLoan: async (id) => {
    set({ isLoading: true });
    try {
      const { loan } = await loansApi.activate(id);
      set((state) => ({
        loans: state.loans.map((l) => (l.id === id ? loan : l)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  closeLoan: async (id) => {
    set({ isLoading: true });
    try {
      const { loan } = await loansApi.close(id);
      set((state) => ({
        loans: state.loans.map((l) => (l.id === id ? loan : l)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  selectLoan: (loan) => set({ selectedLoan: loan }),
  
  fetchRepaymentPlan: async (loanId) => {
    set({ isLoading: true });
    try {
      const { repaymentPlan } = await loansApi.getRepaymentPlan(loanId);
      set({ repaymentPlan, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

// Payments Store
interface PaymentsState {
  payments: Payment[];
  pendingPayments: Payment[];
  isLoading: boolean;
  error: string | null;
  
  fetchPayments: (params?: any) => Promise<void>;
  fetchPending: () => Promise<void>;
  createPayment: (data: any) => Promise<void>;
  decision: (id: string, data: any) => Promise<void>;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: [],
  pendingPayments: [],
  isLoading: false,
  error: null,
  
  fetchPayments: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { payments } = await paymentsApi.list(params);
      set({ payments, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  fetchPending: async () => {
    set({ isLoading: true, error: null });
    try {
      const { payments } = await paymentsApi.getPending();
      set({ pendingPayments: payments, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  createPayment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { payment } = await paymentsApi.create(data);
      set((state) => ({
        payments: [payment, ...state.payments],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  decision: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await paymentsApi.decision(id, data);
      set((state) => ({
        pendingPayments: state.pendingPayments.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

// Settings Store
interface SettingsState {
  reminderConfig: any;
  isLoading: boolean;
  error: string | null;
  
  fetchConfig: () => Promise<void>;
  updateConfig: (data: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  reminderConfig: null,
  isLoading: false,
  error: null,
  
  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await remindersApi.getConfig();
      set({ reminderConfig: config, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  updateConfig: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await remindersApi.updateConfig(data);
      set((state) => ({
        reminderConfig: { ...state.reminderConfig, ...data },
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

// Re-export
import { reportsApi } from '../services/api';