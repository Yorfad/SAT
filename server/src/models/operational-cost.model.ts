export interface ServiceOperationalCost {
    id: number;
    serviceId: number;
    invoiceId: number | null;
    clientUserId: number;
    costAmount: number;
    revenueAmount: number;
    profitAmount: number; // Calculated: revenueAmount - costAmount
    description: string | null;
    costDate: Date;
    createdByUserId: number;
    createdAt: Date;
}

export interface CreateOperationalCostDTO {
    serviceId: number;
    invoiceId?: number;
    clientUserId: number;
    costAmount: number;
    revenueAmount: number;
    description?: string;
    costDate: string; // ISO date string
    createdByUserId: number;
}

export interface UpdateOperationalCostDTO {
    costAmount?: number;
    revenueAmount?: number;
    description?: string;
    costDate?: string;
}

export interface OperationalCostWithDetails extends ServiceOperationalCost {
    serviceName: string;
    clientName: string;
    creatorName: string;
}

export interface OperationalCostSummary {
    totalCosts: number;
    totalRevenue: number;
    totalProfit: number;
    byService: {
        serviceId: number;
        serviceName: string;
        totalCosts: number;
        totalRevenue: number;
        totalProfit: number;
    }[];
}
