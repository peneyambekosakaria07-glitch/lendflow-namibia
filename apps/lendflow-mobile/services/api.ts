// API Service for LendFlow Namibia
// Connects mobile app to Fastify backend

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const token = await getStoredToken();
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  
  return response.json();
}

// Token storage (use expo-secure-store in production)
let storedToken: string | null = null;

export async function setStoredToken(token: string) {
  storedToken = token;
}

export async function getStoredToken(): Promise<string | null> {
  return storedToken;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; lender: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  
  register: (data: { businessName: string; ownerName: string; email: string; phone: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string; lender: any }>('/auth/register', {
      method: 'POST',
      body: data,
    }),
  
  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
  
  me: () => request<any>('/auth/me'),
};

// Dashboard / Reports
export const reportsApi = {
  getDashboard: () => request<DashboardMetrics>('/reports/dashboard'),
  getCapitalAtRisk: () => request<any>('/reports/capital-at-risk'),
  getCollections: (month?: string) => request<any>(`/reports/collections${month ? `?month=${month}` : ''}`),
  getLatePaymentRatio: () => request<any>('/reports/late-payment-ratio'),
};

export interface DashboardMetrics {
  capitalAtRisk: number;
  expectedCollectionsThisMonth: number;
  latePaymentRatio: number;
  activeBorrowers: number;
  activeLoans: number;
  averageLoanSize: number;
  collectionRateThisMonth: number;
}

// Borrowers
export const borrowersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ borrowers: any[]; pagination: any }>(`/borrowers${query ? `?${query}` : ''}`);
  },
  
  get: (id: string) => request<{ borrower: any }>(`/borrowers/${id}`),
  
  create: (data: Omit<Borrower, 'id' | 'lenderId' | 'createdAt' | 'updatedAt'>) =>
    request<{ borrower: any }>('/borrowers', { method: 'POST', body: data }),
  
  update: (id: string, data: Partial<Borrower>) =>
    request<{ borrower: any }>(`/borrowers/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) => request<void>(`/borrowers/${id}`, { method: 'DELETE' }),
  
  getLoans: (id: string) => request<{ loans: any[] }>(`/borrowers/${id}/loans`),
  
  getDocuments: (id: string) => request<{ documents: any[] }>(`/borrowers/${id}/documents`),
};

export interface Borrower {
  id: string;
  fullName: string;
  nationalId?: string;
  phone: string;
  email?: string;
  employmentInfo?: string;
  employerName?: string;
}

// Loans
export const loansApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ loans: any[]; pagination: any }>(`/loans${query ? `?${query}` : ''}`);
  },
  
  get: (id: string) => request<{ loan: any }>(`/loans/${id}`),
  
  create: (data: LoanCreateInput) =>
    request<{ loan: any; summary: any }>('/loans', { method: 'POST', body: data }),
  
  activate: (id: string) =>
    request<{ loan: any }>(`/loans/${id}/activate`, { method: 'POST' }),
  
  close: (id: string) =>
    request<{ loan: any }>(`/loans/${id}/close`, { method: 'POST' }),
  
  getRepaymentPlan: (id: string) =>
    request<{ repaymentPlan: any[] }>(`/loans/${id}/repayment-plan`),
};

export interface LoanCreateInput {
  borrowerId: string;
  principal: number;
  annualRate: number;
  interestType: 'simple' | 'compound';
  termMonths: number;
  startDate: string;
  penaltyRate?: number;
  gracePeriodDays?: number;
}

// Payments
export const paymentsApi = {
  list: (params?: { loanId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ payments: any[] }>(`/payments${query ? `?${query}` : ''}`);
  },
  
  getPending: () => request<{ payments: any[] }>('/payments/pending'),
  
  create: (data: { loanId: string; amount: number; paymentMethod?: string; referenceNumber?: string }) =>
    request<{ payment: any }>('/payments', { method: 'POST', body: data }),
  
  decision: (id: string, data: { decision: 'approve' | 'reject'; verifiedAmount?: number; rejectionReason?: string }) =>
    request<{ success: boolean }>(`/payments/${id}/decision`, { method: 'POST', body: data }),
};

// Reminders
export const remindersApi = {
  getConfig: () => request<any>('/reminders/config'),
  
  updateConfig: (data: { reminderDaysBefore?: number; reminderDayOf?: boolean; reminderDaysAfter?: number }) =>
    request<{ success: boolean }>('/reminders/config', { method: 'PUT', body: data }),
  
  sendTest: (borrowerId: string, reminderType: string, channel: 'sms' | 'whatsapp') =>
    request<{ success: boolean; sid: string }>('/reminders/test', {
      method: 'POST',
      body: { borrowerId, reminderType, channel },
    }),
  
  getLogs: (loanId: string) =>
    request<{ logs: any[] }>(`/reminders/loans/${loanId}`),
};

// Documents
export const documentsApi = {
  list: (params?: { borrowerId?: string; loanId?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ documents: any[] }>(`/documents${query ? `?${query}` : ''}`);
  },
  
  create: (data: { borrowerId?: string; loanId?: string; type: string; fileUrl: string; originalName: string }) =>
    request<{ document: any }>('/documents', { method: 'POST', body: data }),
  
  delete: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
};

export default {
  auth: authApi,
  reports: reportsApi,
  borrowers: borrowersApi,
  loans: loansApi,
  payments: paymentsApi,
  reminders: remindersApi,
  documents: documentsApi,
};