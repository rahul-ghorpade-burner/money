export interface UserConfig {
  monthly_income: string;
  savings_percentage: string;
  updated_at: string;
}

export interface ApiError {
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';
    message: string;
  };
}

export interface Expense {
  id: string;
  amount: string;
  label: string | null;
  expense_date: string;
  created_at: string;
}

export interface ExpenseCreateBody {
  amount: string;
  label?: string;
  expense_date: string;
}
