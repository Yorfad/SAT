export interface MonthlyInvoice {
    id: number;
    tenantId: number;
    clientUserId: number;
    invoiceYear: number;
    invoiceMonth: number;
    previousDebt: number;
    monthlyFee: number;
    extrasFee: number;
    extrasDescription: string | null;
    totalDue: number;
    amountPaid: number;
    balance: number;
    paymentStatus: 'paid' | 'pending' | 'overdue';
    servicesStatus: 'pending' | 'completed';
    dueDate: Date | null;
    createdAt: Date;
}