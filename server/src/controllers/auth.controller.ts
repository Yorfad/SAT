import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { WorkspaceService } from "../services/workspace.service";
import { ClientService } from "../services/client.service";
import { getAllTenantPools } from "../config/database";


export async function register(req: Request, res: Response) {
  const db = req.db!;
  const { email, password, full_name, nit, role = "client", birth_date = null, phone_number = null, workspace_id = null } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await db.query(
      `INSERT INTO users (email,password_hash,full_name,nit,role,birth_date,phone_number) VALUES (?,?,?,?,?,?,?)`,
      [email, hash, full_name, nit, role, birth_date, phone_number]
    );

    const userId = (r as any).insertId;

    // Si es cliente, crear perfil y asignar servicios por defecto
    if (role === 'client') {
      await db.query(
        `INSERT INTO clients_profiles (user_id, workspace_id, overall_rating)
         VALUES (?, ?, 5.00)`,
        [userId, workspace_id]
      );

      // Auto-asignar servicios por defecto
      const clientService = new ClientService(db);
      await clientService.assignDefaultServices(userId, workspace_id);
    }

    res.status(201).json({ id: userId });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email o NIT ya existe" });
    throw e;
  }
}


export async function login(req: Request, res: Response) {
const db = req.db!;
const { email, password } = req.body;
const [rows] = await db.query(
`SELECT id, email, password_hash, full_name, role, is_active, deactivation_reason, deactivated_at FROM users WHERE email=? LIMIT 1`,
[email]
);
const u = (rows as any[])[0];

// Verificar que el usuario existe
if (!u) return res.status(401).json({ message: "Credenciales inválidas" });

// Verificar contraseña
const ok = await bcrypt.compare(password, u.password_hash);
if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

// Verificar si el cliente está desactivado
if (!u.is_active) {
  return res.status(403).json({
    message: "Cuenta desactivada",
    reason: u.deactivation_reason || "No especificado",
    deactivated_at: u.deactivated_at
  });
}

const secret: Secret = env.jwtSecret;
const opts: SignOptions = { expiresIn: env.jwtExpiresIn };

// Obtener workspace primario del usuario
const workspaceService = new WorkspaceService(db);
const primaryWorkspace = await workspaceService.getPrimaryWorkspace(u.id);
const userWorkspaces = await workspaceService.getUserWorkspaces(u.id);

const token = jwt.sign(
  {
    sub: u.id,
    role: u.role,
    name: u.full_name,
    tenant: req.tenantSlug,
    defaultWorkspace: primaryWorkspace?.slug || null
  },
  secret,
  opts
);
res.json({
  token,
  user: {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    default_workspace: primaryWorkspace,
    workspaces: userWorkspaces
  },
  tenant: req.tenantSlug
});
}


/**
 * Login para clientes móviles usando NIT + contraseña
 */
export async function clientLogin(req: Request, res: Response) {
  const db = req.db!;
  const { nit, password } = req.body;

  // Buscar usuario cliente por NIT
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.nit, u.is_active,
            u.deactivation_reason, u.deactivated_at, u.phone_number,
            cp.overall_rating
     FROM users u
     LEFT JOIN clients_profiles cp ON cp.user_id = u.id
     WHERE u.nit = ? AND u.role = 'client'
     LIMIT 1`,
    [nit]
  );
  const u = (rows as any[])[0];

  if (!u) {
    return res.status(401).json({ message: "NIT o contraseña incorrectos" });
  }

  // Verificar contraseña
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) {
    return res.status(401).json({ message: "NIT o contraseña incorrectos" });
  }

  // Verificar si está activo
  if (!u.is_active) {
    return res.status(403).json({
      message: "Cuenta desactivada",
      reason: u.deactivation_reason || "Contacte al administrador",
      deactivated_at: u.deactivated_at
    });
  }

  const secret: Secret = env.jwtSecret;
  const opts: SignOptions = { expiresIn: env.jwtExpiresIn };

  // Obtener workspace del cliente
  const workspaceService = new WorkspaceService(db);
  const primaryWorkspace = await workspaceService.getPrimaryWorkspace(u.id);

  const token = jwt.sign(
    {
      sub: u.id,
      role: u.role,
      name: u.full_name,
      tenant: req.tenantSlug,
      defaultWorkspace: primaryWorkspace?.slug || null
    },
    secret,
    opts
  );

  res.json({
    token,
    user: {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      nit: u.nit,
      phone_number: u.phone_number,
      role: u.role,
      is_active: u.is_active,
      overall_rating: u.overall_rating,
      workspace: primaryWorkspace
    },
    tenant: req.tenantSlug
  });
}


/**
 * Registro de clientes desde la app móvil
 * REQUIERE código de invitación válido
 */
export async function clientRegister(req: Request, res: Response) {
  const db = req.db!;
  const {
    invitation_code,
    password,
    nit,
    full_name,
    email = null,
    phone_number = null,
    address = null,
    birth_date = null,
    business_name = null,
    tax_regime = null
  } = req.body;

  // 1. Validar código de invitación
  const [invitations]: any = await db.query(
    `SELECT ic.*
     FROM invitation_codes ic
     WHERE ic.code = ? AND ic.is_active = TRUE`,
    [invitation_code.toUpperCase()]
  );

  if (!invitations || invitations.length === 0) {
    return res.status(400).json({ message: "Código de invitación inválido" });
  }

  const invitation = invitations[0];

  // Verificar expiración
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return res.status(400).json({ message: "Este código de invitación ha expirado" });
  }

  // Verificar límite de usos
  if (invitation.max_uses !== null && invitation.uses_count >= invitation.max_uses) {
    return res.status(400).json({ message: "Este código de invitación ha alcanzado el límite de usos" });
  }

  // 2. Validar campos requeridos según configuración del código
  const requiredFields = typeof invitation.required_fields === 'string'
    ? JSON.parse(invitation.required_fields)
    : invitation.required_fields || [];

  const fieldValues: Record<string, any> = {
    nit, full_name, email, phone_number, address, birth_date, business_name, tax_regime
  };

  for (const field of requiredFields) {
    if (field === 'password') continue; // password siempre requerido y ya validado
    if (!fieldValues[field] || fieldValues[field].toString().trim() === '') {
      const fieldNames: Record<string, string> = {
        nit: 'NIT',
        full_name: 'Nombre completo',
        email: 'Correo electrónico',
        phone_number: 'Teléfono',
        address: 'Dirección',
        birth_date: 'Fecha de nacimiento',
        business_name: 'Nombre del negocio',
        tax_regime: 'Régimen tributario'
      };
      return res.status(400).json({
        message: `El campo "${fieldNames[field] || field}" es requerido`
      });
    }
  }

  // 3. Verificar si el NIT ya existe (si se proporciona)
  if (nit) {
    const [existing] = await db.query(
      `SELECT id FROM users WHERE nit = ? LIMIT 1`,
      [nit]
    );
    if ((existing as any[]).length > 0) {
      return res.status(409).json({ message: "Este NIT ya está registrado" });
    }
  }

  // 4. Verificar email si se proporciona
  if (email) {
    const [emailExists] = await db.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if ((emailExists as any[]).length > 0) {
      return res.status(409).json({ message: "Este email ya está registrado" });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const isActive = invitation.auto_approve ? 1 : 0;

  try {
    // 5. Crear usuario cliente
    const [result] = await db.query(
      `INSERT INTO users (
        email, password_hash, full_name, nit, role,
        phone_number, is_active, registered_via_invitation_id
      ) VALUES (?, ?, ?, ?, 'client', ?, ?, ?)`,
      [email, hash, full_name, nit, phone_number, isActive, invitation.id]
    );

    const userId = (result as any).insertId;

    // 6. Crear perfil de cliente con campos adicionales y workspace
    await db.query(
      `INSERT INTO clients_profiles (user_id, workspace_id, overall_rating, notes)
       VALUES (?, ?, 5.00, ?)`,
      [userId, invitation.workspace_id || null, address ? `Dirección: ${address}` : null]
    );

    // 7. Asignar al workspace si aplica
    if (invitation.workspace_id) {
      await db.query(
        `INSERT INTO user_workspaces (user_id, workspace_id, is_primary)
         VALUES (?, ?, TRUE)`,
        [userId, invitation.workspace_id]
      );
    }

    // 8. AUTO-ASIGNAR servicios por defecto (assignment_type = 'all_clients')
    const clientService = new ClientService(db);
    const defaultAssigned = await clientService.assignDefaultServices(userId, invitation.workspace_id);
    console.log(`[REGISTER] Cliente ${userId} registrado con ${defaultAssigned} servicios por defecto`);

    // 9. Asignar servicios adicionales configurados en la invitación
    if (invitation.default_services) {
      const invitationServices = typeof invitation.default_services === 'string'
        ? JSON.parse(invitation.default_services)
        : invitation.default_services;

      for (const serviceId of invitationServices) {
        // Verificar que no esté ya asignado (por los defaults)
        const [existing]: any = await db.query(
          'SELECT id FROM client_services WHERE client_user_id = ? AND service_id = ?',
          [userId, serviceId]
        );
        if (existing.length === 0) {
          await db.query(
            `INSERT INTO client_services (client_user_id, service_id, start_date, status)
             VALUES (?, ?, CURDATE(), 'active')`,
            [userId, serviceId]
          );
        }
      }
    }

    // 10. Registrar uso del código
    await db.query(
      `INSERT INTO invitation_code_uses (invitation_code_id, registered_user_id, ip_address)
       VALUES (?, ?, ?)`,
      [invitation.id, userId, req.ip]
    );

    // 11. Incrementar contador de usos
    await db.query(
      `UPDATE invitation_codes SET uses_count = uses_count + 1 WHERE id = ?`,
      [invitation.id]
    );

    res.status(201).json({
      id: userId,
      message: invitation.auto_approve
        ? "¡Registro exitoso! Ya puedes iniciar sesión."
        : "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.",
      pending_approval: !invitation.auto_approve,
      auto_approved: invitation.auto_approve
    });
  } catch (e: any) {
    console.error("Error en registro de cliente:", e);
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "NIT o email ya registrado" });
    }
    throw e;
  }
}


/**
 * Login para clientes móviles SIN requerir tenant
 * Busca el NIT en TODOS los tenants configurados
 */
export async function mobileClientLogin(req: Request, res: Response) {
  const { nit, password } = req.body;

  if (!nit || !password) {
    return res.status(400).json({ message: "NIT y contraseña son requeridos" });
  }

  const tenantPools = getAllTenantPools();

  // Buscar el cliente en todos los tenants
  for (const { slug, pool } of tenantPools) {
    try {
      const [rows] = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.nit, u.is_active,
                u.deactivation_reason, u.deactivated_at, u.phone_number,
                cp.overall_rating, cp.workspace_id
         FROM users u
         LEFT JOIN clients_profiles cp ON cp.user_id = u.id
         WHERE u.nit = ? AND u.role = 'client'
         LIMIT 1`,
        [nit]
      );
      const u = (rows as any[])[0];

      if (!u) continue; // No encontrado en este tenant, seguir buscando

      // Encontrado! Verificar contraseña
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) {
        return res.status(401).json({ message: "NIT o contraseña incorrectos" });
      }

      // Verificar si está activo
      if (!u.is_active) {
        return res.status(403).json({
          message: "Cuenta desactivada",
          reason: u.deactivation_reason || "Contacte al administrador",
          deactivated_at: u.deactivated_at
        });
      }

      const secret: Secret = env.jwtSecret;
      const opts: SignOptions = { expiresIn: env.jwtExpiresIn };

      // Obtener workspace del cliente
      const workspaceService = new WorkspaceService(pool);
      const primaryWorkspace = await workspaceService.getPrimaryWorkspace(u.id);

      const token = jwt.sign(
        {
          sub: u.id,
          role: u.role,
          name: u.full_name,
          tenant: slug,
          defaultWorkspace: primaryWorkspace?.slug || null
        },
        secret,
        opts
      );

      return res.json({
        token,
        user: {
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          nit: u.nit,
          phone_number: u.phone_number,
          role: u.role,
          is_active: u.is_active,
          overall_rating: u.overall_rating,
          workspace: primaryWorkspace
        },
        tenant: slug // Importante: retornar el tenant encontrado
      });
    } catch (err) {
      console.error(`Error buscando en tenant ${slug}:`, err);
      // Continuar con el siguiente tenant
    }
  }

  // No encontrado en ningún tenant
  return res.status(401).json({ message: "NIT o contraseña incorrectos" });
}