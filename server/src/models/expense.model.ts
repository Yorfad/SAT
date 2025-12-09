export interface Expense {
    id: number;
    expenseType: 'one_time' | 'monthly_recurring';
    description: string;
    amount: number;
    expenseDate: Date;
    expenseMonth: number;
    expenseYear: number;
    category: string | null;
    createdByUserId: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateExpenseDTO {
    expenseType: 'one_time' | 'monthly_recurring';
    description: string;
    amount: number;
    expenseDate: string; // ISO date string
    category?: string;
    createdByUserId: number;
}

export interface UpdateExpenseDTO {
    description?: string;
    amount?: number;
    expenseDate?: string;
    category?: string;
    isActive?: boolean;
}

export interface ExpenseWithCreator extends Expense {
    creatorName: string;
}

export interface ExpenseSummary {
    totalOneTime: number;
    totalRecurring: number;
    total: number;
    byCategory: { category: string; total: number }[];
}
