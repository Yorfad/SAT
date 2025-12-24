import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getAllTenantPools } from "../config/database";
import { sign } from "jsonwebtoken";
import { env } from "../config/env";

/**
 * Genera un código numérico de 4 dígitos
 */
function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * GET /invitations
 * Lista códigos de invitación del tenant actual
 */
export async function listInvitationCodes(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const isConsolidated = (req as any).isConsolidatedView;

    let query = `
      SELECT
        ic.*,
        w.name as workspace_name,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM invitation_code_uses icu WHERE icu.invitation_code_id = ic.id) as actual_uses
      FROM invitation_codes ic
      LEFT JOIN workspaces w ON w.id = ic.workspace_id
      LEFT JOIN users u ON u.id = ic.created_by_user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isConsolidated && workspaceId) {
      query += ` AND (ic.workspace_id = ? OR ic.workspace_id IS NULL)`;
      params.push(workspaceId);
    }

    query += ` ORDER BY ic.created_at DESC`;

    const [rows] = await req.db!.query(query, params);
    res.json(rows);
  } catch (error: any) {
    console.error("Error listing invitation codes:", error);
    res.status(500).json({ message: "Error al listar códigos", error: error.message });
  }
}

/**
 * GET /invitations/:id
 * Obtiene un código específico
 */
export async function getInvitationCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows]: any = await req.db!.query(
      `SELECT ic.*, w.name as workspace_name
       FROM invitation_codes ic
       LEFT JOIN workspaces w ON w.id = ic.workspace_id
       WHERE ic.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    // Obtener usos recientes
    const [uses] = await req.db!.query(
      `SELECT icu.*, u.full_name, u.nit, u.email
       FROM invitation_code_uses icu
       JOIN users u ON u.id = icu.registered_user_id
       WHERE icu.invitation_code_id = ?
       ORDER BY icu.used_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({ ...rows[0], uses });
  } catch (error: any) {
    console.error("Error getting invitation code:", error);
    res.status(500).json({ message: "Error al obtener código", error: error.message });
  }
}

/**
 * POST /invitations
 * Crea un nuevo código de invitación
 */
export async function createInvitationCode(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const userId = (req as any).user.sub;

    const {
      name,
      description = null,
      workspace_id = workspaceId,
      expires_at = null,
      max_uses = null,
      auto_approve = false,
      default_services = null,
      required_fields = ["nit", "full_name", "password"],
      optional_fields = ["email", "phone_number"]
    } = req.body;

    // Generar código único
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const [existing]: any = await req.db!.query(
        "SELECT id FROM invitation_codes WHERE code = ?",
        [code]
      );
      if (existing.length === 0) break;
      code = generateCode();
      attempts++;
    }

    const [result] = await req.db!.query(
      `INSERT INTO invitation_codes (
        code, workspace_id, name, description,
        expires_at, max_uses, auto_approve,
        default_services, required_fields, optional_fields,
        created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        workspace_id,
        name,
        description,
        expires_at,
        max_uses,
        auto_approve,
        default_services ? JSON.stringify(default_services) : null,
        JSON.stringify(required_fields),
        JSON.stringify(optional_fields),
        userId
      ]
    );

    res.status(201).json({
      id: (result as any).insertId,
      code,
      message: "Código de invitación creado exitosamente"
    });
  } catch (error: any) {
    console.error("Error creating invitation code:", error);
    res.status(500).json({ message: "Error al crear código", error: error.message });
  }
}

/**
 * PUT /invitations/:id
 * Actualiza un código de invitación
 */
export async function updateInvitationCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      expires_at,
      max_uses,
      auto_approve,
      default_services,
      required_fields,
      optional_fields,
      is_active
    } = req.body;

    // Verificar que existe
    const [existing]: any = await req.db!.query(
      "SELECT id FROM invitation_codes WHERE id = ?",
      [id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    await req.db!.query(
      `UPDATE invitation_codes SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        expires_at = ?,
        max_uses = ?,
        auto_approve = COALESCE(?, auto_approve),
        default_services = ?,
        required_fields = COALESCE(?, required_fields),
        optional_fields = COALESCE(?, optional_fields),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [
        name,
        description,
        expires_at,
        max_uses,
        auto_approve,
        default_services ? JSON.stringify(default_services) : null,
        required_fields ? JSON.stringify(required_fields) : null,
        optional_fields ? JSON.stringify(optional_fields) : null,
        is_active,
        id
      ]
    );

    res.json({ message: "Código actualizado exitosamente" });
  } catch (error: any) {
    console.error("Error updating invitation code:", error);
    res.status(500).json({ message: "Error al actualizar código", error: error.message });
  }
}

/**
 * DELETE /invitations/:id
 * Elimina (desactiva) un código de invitación
 */
export async function deleteInvitationCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [result]: any = await req.db!.query(
      "UPDATE invitation_codes SET is_active = FALSE WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    res.json({ message: "Código desactivado exitosamente" });
  } catch (error: any) {
    console.error("Error deleting invitation code:", error);
    res.status(500).json({ message: "Error al eliminar código", error: error.message });
  }
}

/**
 * GET /invitations/validate/:code
 * Valida un código de invitación (público, para el formulario de registro)
 */
export async function validateInvitationCode(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const tenantSlug = (req as any).tenantSlug || 'default';

    const [rows]: any = await req.db!.query(
      `SELECT
        ic.id,
        ic.code,
        ic.workspace_id,
        ic.expires_at,
        ic.max_uses,
        ic.uses_count,
        ic.auto_approve,
        ic.required_fields,
        ic.optional_fields,
        ic.is_active,
        w.name as workspace_name
      FROM invitation_codes ic
      LEFT JOIN workspaces w ON w.id = ic.workspace_id
      WHERE ic.code = ?`,
      [code.toUpperCase()]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Código de invitación no encontrado"
      });
    }

    const invitation = rows[0];

    // Verificar si está activo
    if (!invitation.is_active) {
      return res.status(400).json({
        valid: false,
        message: "Este código de invitación ya no está activo"
      });
    }

    // Verificar expiración
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({
        valid: false,
        message: "Este código de invitación ha expirado"
      });
    }

    // Verificar límite de usos
    if (invitation.max_uses !== null && invitation.uses_count >= invitation.max_uses) {
      return res.status(400).json({
        valid: false,
        message: "Este código de invitación ha alcanzado el límite de usos"
      });
    }

    // Código válido - devolver info para el formulario
    // El tenant viene del header/subdomain, no de la base de datos
    res.json({
      valid: true,
      invitation: {
        id: invitation.id,
        tenant_slug: tenantSlug,
        tenant_name: tenantSlug.toUpperCase(),
        workspace_name: invitation.workspace_name,
        required_fields: typeof invitation.required_fields === 'string'
          ? JSON.parse(invitation.required_fields)
          : invitation.required_fields,
        optional_fields: typeof invitation.optional_fields === 'string'
          ? JSON.parse(invitation.optional_fields)
          : invitation.optional_fields
      }
    });
  } catch (error: any) {
    console.error("Error validating invitation code:", error);
    res.status(500).json({ message: "Error al validar código", error: error.message });
  }
}

// ========================================
// ENDPOINTS PÚBLICOS (SIN TENANT)
// Para la app móvil - buscan en todos los tenants
// ========================================

/**
 * POST /api/public/validate-code
 * Valida un código de 4 dígitos buscando en todos los tenants
 * Busca por workspace.registration_code
 * NO requiere header X-Tenant
 */
export async function publicValidateCode(req: Request, res: Response) {
  try {
    const { code } = req.body;

    if (!code || !/^\d{4}$/.test(code)) {
      return res.status(400).json({
        valid: false,
        message: "Código inválido. Debe ser de 4 dígitos."
      });
    }

    const tenantPools = getAllTenantPools();

    for (const { slug, pool } of tenantPools) {
      try {
        // Buscar por workspace.registration_code
        const [rows]: any = await pool.query(
          `SELECT id, name, registration_code, auto_approve_registration
           FROM workspaces
           WHERE registration_code = ? AND is_active = TRUE`,
          [code]
        );

        if (rows && rows.length > 0) {
          const workspace = rows[0];

          // Obtener nombre del tenant
          const [tenantInfo]: any = await pool.query(
            "SELECT display_name FROM settings LIMIT 1"
          );

          const tenantName = tenantInfo?.[0]?.display_name || slug.toUpperCase();

          return res.json({
            valid: true,
            tenant: slug,
            tenantName: tenantName,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            autoApprove: workspace.auto_approve_registration
          });
        }
      } catch (err) {
        console.warn(`Error buscando código en tenant ${slug}:`, err);
      }
    }

    return res.status(404).json({
      valid: false,
      message: "Código no encontrado"
    });

  } catch (error: any) {
    console.error("Error validating public code:", error);
    res.status(500).json({ message: "Error al validar código", error: error.message });
  }
}

/**
 * POST /api/public/register-with-code
 * Registra un nuevo cliente usando un código de 4 dígitos del workspace
 * Busca por workspace.registration_code en todos los tenants
 * NO requiere header X-Tenant
 */
export async function publicRegisterWithCode(req: Request, res: Response) {
  try {
    const {
      code,
      fullName,
      nit,
      password,
      email,
      phoneNumber,
      customFields // Campos personalizados definidos por el admin
    } = req.body;

    // Validaciones básicas
    if (!code || !/^\d{4}$/.test(code)) {
      return res.status(400).json({ message: "Código inválido" });
    }
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ message: "Nombre requerido" });
    }
    if (!nit || nit.trim().length < 4) {
      return res.status(400).json({ message: "NIT requerido" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Contraseña debe tener al menos 6 caracteres" });
    }

    const tenantPools = getAllTenantPools();
    let foundTenant: { slug: string; pool: any } | null = null;
    let workspace: any = null;

    // Buscar el código en workspaces de todos los tenants
    for (const tenant of tenantPools) {
      try {
        const [rows]: any = await tenant.pool.query(
          `SELECT id, name, registration_code, auto_approve_registration
           FROM workspaces
           WHERE registration_code = ? AND is_active = TRUE`,
          [code]
        );

        if (rows && rows.length > 0) {
          foundTenant = tenant;
          workspace = rows[0];
          break;
        }
      } catch (err) {
        console.warn(`Error buscando en tenant ${tenant.slug}:`, err);
      }
    }

    if (!foundTenant || !workspace) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    const pool = foundTenant.pool;

    // Verificar que el NIT no exista ya
    const [existingNit]: any = await pool.query(
      "SELECT id FROM users WHERE nit = ?",
      [nit]
    );

    if (existingNit && existingNit.length > 0) {
      return res.status(400).json({ message: "Ya existe un usuario con este NIT" });
    }

    // Verificar email si se proporciona
    if (email) {
      const [existingEmail]: any = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingEmail && existingEmail.length > 0) {
        return res.status(400).json({ message: "Ya existe un usuario con este email" });
      }
    }

    // Crear el usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const isActive = workspace.auto_approve_registration ? 1 : 0;

    const [userResult]: any = await pool.query(
      `INSERT INTO users (
        email, password_hash, full_name, nit, phone_number,
        role, is_active
      ) VALUES (?, ?, ?, ?, ?, 'client', ?)`,
      [
        email || null,
        hashedPassword,
        fullName.trim(),
        nit.trim(),
        phoneNumber || null,
        isActive
      ]
    );

    const userId = userResult.insertId;

    // Crear perfil de cliente con workspace
    await pool.query(
      `INSERT INTO clients_profiles (user_id, workspace_id) VALUES (?, ?)`,
      [userId, workspace.id]
    );

    // Asignar al workspace
    await pool.query(
      `INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary)
       VALUES (?, ?, 'member', TRUE)`,
      [userId, workspace.id]
    );

    // Si hay campos personalizados, guardarlos
    if (customFields && typeof customFields === 'object') {
      for (const [fieldKey, value] of Object.entries(customFields)) {
        if (value !== null && value !== undefined && value !== '') {
          // Obtener el ID del campo
          const [fieldRows]: any = await pool.query(
            `SELECT id FROM client_custom_fields WHERE field_key = ? AND is_active = TRUE`,
            [fieldKey]
          );

          if (fieldRows && fieldRows.length > 0) {
            await pool.query(
              `INSERT INTO client_field_values (client_profile_id, field_id, field_value)
               SELECT cp.id, ?, ?
               FROM clients_profiles cp WHERE cp.user_id = ?`,
              [fieldRows[0].id, String(value), userId]
            );
          }
        }
      }
    }

    // Si auto_approve, generar token
    if (workspace.auto_approve_registration) {
      const token = sign(
        {
          sub: userId,
          role: "client",
          name: fullName,
          tenant: foundTenant.slug,
          defaultWorkspace: workspace.id
        },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
      );

      return res.status(201).json({
        success: true,
        message: "Registro exitoso",
        token,
        user: {
          id: userId,
          fullName,
          nit,
          email,
          role: "client",
          workspaceId: workspace.id,
          workspaceName: workspace.name
        }
      });
    }

    // Si no auto_approve, el admin debe activarlo
    res.status(201).json({
      success: true,
      message: "Registro enviado. El administrador debe aprobar tu cuenta.",
      pendingApproval: true
    });

  } catch (error: any) {
    console.error("Error registering with code:", error);
    res.status(500).json({ message: "Error al registrar", error: error.message });
  }
}
