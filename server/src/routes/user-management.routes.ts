import { Router } from 'express';
import * as controller from '../controllers/user-management.controller';
import { authenticateToken } from '../middleware/auth';
import { resolveWorkspace, loadWorkspaceId } from '../middleware/resolveWorkspace';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Middleware para verificar que es admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Se requieren permisos de administrador' });
  }
  next();
};

// Aplicar requireAdmin a todas las rutas
router.use(requireAdmin);

// ========================================
// GESTIÓN DE USUARIOS
// ========================================

// Listar usuarios (admins y empleados)
router.get('/users', controller.listUsers);

// Obtener detalles de un usuario
router.get('/users/:id', controller.getUserDetails);

// Crear nuevo usuario
router.post('/users', controller.createUser);

// Actualizar usuario
router.put('/users/:id', controller.updateUser);

// Cambiar contraseña
router.patch('/users/:id/password', controller.changePassword);

// Activar/desactivar usuario
router.patch('/users/:id/status', controller.toggleUserStatus);

// Eliminar usuario
router.delete('/users/:id', controller.deleteUser);

// Actualizar roles de un usuario
router.put('/users/:id/roles', controller.updateUserRoles);

// Actualizar workspaces de un usuario
router.put('/users/:id/workspaces', controller.updateUserWorkspaces);

// ========================================
// ROLES
// ========================================

// Listar roles disponibles
router.get('/roles', controller.listRoles);

export default router;
