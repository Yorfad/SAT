export interface ClientInfraction {
    id: number;
    clientUserId: number;
    infractionType: 'automatic_unpaid' | 'manual';
    reason: string;
    relatedInvoiceId: number | null;
    createdByUserId: number | null;
    isActive: boolean;
    resolvedByUserId: number | null;
    resolvedAt: Date | null;
    resolutionNotes: string | null;
    createdAt: Date;
}

export interface CreateInfractionDTO {
    clientUserId: number;
    infractionType: 'automatic_unpaid' | 'manual';
    reason: string;
    relatedInvoiceId?: number;
    createdByUserId?: number;
}

export interface ResolveInfractionDTO {
    resolvedByUserId: number;
    resolutionNotes?: string;
}

export interface InfractionWithClient extends ClientInfraction {
    clientName: string;
    clientEmail: string;
    invoiceMonth?: number;
    invoiceYear?: number;
}
