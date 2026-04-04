export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface FinancialCategory {
  id: string;
  tenantId: string;
  name: string;
  type: TransactionType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  description: string;
  type: TransactionType;
  categoryId?: string;
  categoryName?: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  appointmentId?: string;
  professionalId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  FIADO = 'FIADO',
}

export enum PaymentMethod {
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  DINHEIRO = 'DINHEIRO',
  BOLETO = 'BOLETO',
  OUTRO = 'OUTRO',
}

export interface CreateFinancialCategoryRequest {
  tenantId: string;
  name: string;
  type: TransactionType;
}

export interface CreateFinancialTransactionRequest {
  tenantId: string;
  description: string;
  type: TransactionType;
  categoryId?: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  appointmentId?: string;
  professionalId?: string;
}

export interface FinancialDashboardResponse {
  tenantId: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategorySummary[];
  incomesByCategory: CategorySummary[];
  pendingTransactions: FinancialTransaction[];
}

export interface CategorySummary {
  categoryName: string;
  totalAmount: number;
}
