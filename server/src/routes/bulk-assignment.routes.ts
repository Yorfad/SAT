import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { resolveWorkspace, loadWorkspaceId } from '../middleware/resolveWorkspace';
import {
  getFilterableFields,
  filterClients,
  bulkAssignTasks,
  getServicesForAssignment,
  getEmployeesForAssignment,
} from '../controllers/bulk-assignment.controller';

const router = Router();

// Autenticación y workspace
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Obtener campos disponibles para filtrar
router.get(
  '/fields',
  requireRoles('admin', 'employee'),
  getFilterableFields
);

// Filtrar clientes según criterios
router.post(
  '/filter-clients',
  requireRoles('admin', 'employee'),
  filterClients
);

// Asignar tareas en masa
router.post(
  '/assign-tasks',
  requireRoles('admin'),
  bulkAssignTasks
);

// Obtener servicios para asignar
router.get(
  '/services',
  requireRoles('admin', 'employee'),
  getServicesForAssignment
);

// Obtener empleados para asignar
router.get(
  '/employees',
  requireRoles('admin'),
  getEmployeesForAssignment
);

export default router;
