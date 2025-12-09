export interface ServiceBundle {
    id: number;
    bundleName: string;
    description: string | null;
    bundlePrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BundleService {
    id: number;
    bundleId: number;
    serviceId: number;
}

export interface ClientBundle {
    id: number;
    clientUserId: number;
    bundleId: number;
    customPrice: number | null;
    startDate: Date | null;
    status: string;
    createdAt: Date;
}

export interface CreateBundleDTO {
    bundleName: string;
    description?: string;
    bundlePrice: number;
    serviceIds: number[];
}

export interface UpdateBundleDTO {
    bundleName?: string;
    description?: string;
    bundlePrice?: number;
    serviceIds?: number[];
    isActive?: boolean;
}

export interface BundleWithServices extends ServiceBundle {
    services: {
        id: number;
        serviceName: string;
        defaultPrice: number;
    }[];
}

export interface AssignBundleToClientDTO {
    clientUserId: number;
    bundleId: number;
    customPrice?: number;
    startDate?: string;
}
