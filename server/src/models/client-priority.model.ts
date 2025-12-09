export interface ClientServicePriority {
  id: number;
  clientUserId: number;
  serviceId: number | null;
  priority: 'baja' | 'normal' | 'alta' | 'urgente';
  notes: string | null;
  createdByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientServicePriorityDTO {
  clientUserId: number;
  serviceId?: number;
  priority: 'baja' | 'normal' | 'alta' | 'urgente';
  notes?: string;
}

export interface UpdateClientServicePriorityDTO {
  priority?: 'baja' | 'normal' | 'alta' | 'urgente';
  notes?: string;
}
