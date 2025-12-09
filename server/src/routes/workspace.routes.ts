import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  listMyWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  assignUserToWorkspace,
  removeUserFromWorkspace,
  getWorkspaceUsers,
  switchWorkspace,
  getConsolidatedDashboard,
  listAllWorkspaces,
  getAvailableUsers
} from '../controllers/workspace.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// === Rutas del usuario actual ===

// Listar mis workspaces
router.get('/my', listMyWorkspaces);

// Cambiar workspace activo
router.post('/switch', switchWorkspace);

// Dashboard consolidado (todos los workspaces)
router.get('/dashboard/consolidated', getConsolidatedDashboard);

// === Rutas de administración (solo admin) ===

// Listar todos los workspaces del sistema
router.get('/', requireRoles('admin'), listAllWorkspaces);

// Crear nuevo workspace
router.post('/', requireRoles('admin'), createWorkspace);

// === Rutas de workspace específico ===

// Obtener workspace por ID
router.get('/:id', getWorkspace);

// Actualizar workspace
router.put('/:id', updateWorkspace);

// Eliminar workspace (soft delete)
router.delete('/:id', deleteWorkspace);

// === Gestión de usuarios del workspace ===

// Obtener usuarios del workspace
router.get('/:id/users', getWorkspaceUsers);

// Obtener usuarios disponibles para asignar
router.get('/:id/available-users', getAvailableUsers);

// Asignar usuario a workspace
router.post('/:id/users', assignUserToWorkspace);

// Remover usuario del workspace
router.delete('/:id/users/:userId', removeUserFromWorkspace);

export default router;
