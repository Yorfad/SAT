export interface User {
    id: number;
    tenantId: number;
    email: string;
    fullName: string;
    passwordHash: string;
    birthDate: Date | null;
    phoneNumber: string | null;
    nit: string;
    role: 'client' | 'admin' | 'employee';
    createdAt: Date;
    isActive: boolean;
}