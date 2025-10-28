export interface Service {
    id: number;
    tenantId: number;
    serviceName: string;
    description: string | null;
    defaultPrice: number;
}