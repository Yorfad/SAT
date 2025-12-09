export interface ClientPoolItem {
  id: number;
  clientUserId: number;
  invoiceId: number | null;
  taskId: number | null;
  serviceId: number | null;
  description: string;
  priority: 'baja' | 'normal' | 'alta' | 'urgente';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  addedByUserId: number | null;
  assignedToUserId: number | null;
  completedByUserId: number | null;
  addedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
}

export interface CreateClientPoolItemDTO {
  clientUserId: number;
  invoiceId?: number;
  taskId?: number;
  serviceId?: number;
  description: string;
  priority?: 'baja' | 'normal' | 'alta' | 'urgente';
  notes?: string;
}

export interface AssignPoolItemDTO {
  assignedToUserId: number;
}

export interface CompletePoolItemDTO {
  notes?: string;
}
