import { Request, Response } from "express";

/**
 * POST /observations
 * Crear una nueva observación y/o rating para una tarea
 */
export async function createObservation(req: Request, res: Response) {
  try {
    const { task_id, client_user_id, observation_text, rating } = req.body;
    const userId = (req as any).user.sub;

    // Validar que al menos haya observación o rating
    if (!observation_text && rating === undefined) {
      return res.status(400).json({
        message: "Debe proporcionar al menos una observación o calificación"
      });
    }

    // Validar rating si se proporciona
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "La calificación debe estar entre 1 y 5"
      });
    }

    // Verificar que la tarea existe
    const [[task]]: any = await req.db!.query(
      "SELECT id FROM monthly_service_checklist WHERE id = ?",
      [task_id]
    );

    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Crear la observación
    const [result] = await req.db!.query(
      `INSERT INTO task_observations
       (task_id, client_user_id, created_by_user_id, observation_text, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [task_id, client_user_id, userId, observation_text || null, rating || null]
    );

    console.log(`[OBSERVATION] Usuario ${userId} creó observación para tarea ${task_id}${rating ? ` con rating ${rating}` : ""}`);

    res.status(201).json({
      ok: true,
      id: (result as any).insertId,
      message: "Observación creada exitosamente"
    });
  } catch (error: any) {
    console.error("Error creating observation:", error);
    res.status(500).json({
      message: "Error al crear observación",
      error: error.message
    });
  }
}

/**
 * GET /clients/:id/observations
 * Obtener todas las observaciones de un cliente
 */
export async function getClientObservations(req: Request, res: Response) {
  try {
    const { id: clientId } = req.params;

    const [observations] = await req.db!.query(
      `SELECT
         o.id,
         o.task_id,
         o.observation_text,
         o.rating,
         o.is_primary,
         o.created_at,
         o.updated_at,
         u.full_name AS created_by_name,
         u.id AS created_by_id,
         msc.task_name,
         mi.invoice_month,
         mi.invoice_year
       FROM task_observations o
       JOIN users u ON u.id = o.created_by_user_id
       JOIN monthly_service_checklist msc ON msc.id = o.task_id
       JOIN monthly_invoices mi ON mi.id = msc.invoice_id
       WHERE o.client_user_id = ?
       ORDER BY o.is_primary DESC, o.created_at DESC`,
      [clientId]
    );

    res.json(observations);
  } catch (error: any) {
    console.error("Error fetching client observations:", error);
    res.status(500).json({
      message: "Error al obtener observaciones",
      error: error.message
    });
  }
}

/**
 * GET /clients/:id/primary-observation
 * Obtener la observación primordial de un cliente
 */
export async function getPrimaryObservation(req: Request, res: Response) {
  try {
    const { id: clientId } = req.params;

    const [[observation]]: any = await req.db!.query(
      `SELECT
         o.id,
         o.observation_text,
         o.created_at,
         u.full_name AS created_by_name
       FROM task_observations o
       JOIN users u ON u.id = o.created_by_user_id
       WHERE o.client_user_id = ? AND o.is_primary = TRUE
       LIMIT 1`,
      [clientId]
    );

    if (!observation) {
      return res.json(null);
    }

    res.json(observation);
  } catch (error: any) {
    console.error("Error fetching primary observation:", error);
    res.status(500).json({
      message: "Error al obtener observación primordial",
      error: error.message
    });
  }
}

/**
 * PATCH /observations/:id/primary
 * Marcar/desmarcar una observación como primordial
 */
export async function togglePrimaryObservation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_primary } = req.body;
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;

    // Verificar que la observación existe
    const [[observation]]: any = await req.db!.query(
      "SELECT id, created_by_user_id, client_user_id FROM task_observations WHERE id = ?",
      [id]
    );

    if (!observation) {
      return res.status(404).json({ message: "Observación no encontrada" });
    }

    // Solo admin puede marcar como primordial
    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Solo administradores pueden marcar observaciones como primordiales"
      });
    }

    // Si se marca como primordial, desmarcar todas las demás del cliente
    if (is_primary) {
      await req.db!.query(
        `UPDATE task_observations
         SET is_primary = FALSE
         WHERE client_user_id = ? AND is_primary = TRUE`,
        [observation.client_user_id]
      );
    }

    // Actualizar la observación
    await req.db!.query(
      "UPDATE task_observations SET is_primary = ?, updated_at = NOW() WHERE id = ?",
      [is_primary, id]
    );

    console.log(`[OBSERVATION] Observación ${id} ${is_primary ? "marcada" : "desmarcada"} como primordial por usuario ${userId}`);

    res.json({
      ok: true,
      message: is_primary
        ? "Observación marcada como primordial"
        : "Observación desmarcada como primordial"
    });
  } catch (error: any) {
    console.error("Error toggling primary observation:", error);
    res.status(500).json({
      message: "Error al actualizar observación",
      error: error.message
    });
  }
}

/**
 * DELETE /observations/:id
 * Eliminar una observación (solo autor o admin)
 */
export async function deleteObservation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;

    // Verificar que la observación existe
    const [[observation]]: any = await req.db!.query(
      "SELECT id, created_by_user_id FROM task_observations WHERE id = ?",
      [id]
    );

    if (!observation) {
      return res.status(404).json({ message: "Observación no encontrada" });
    }

    // Solo el autor o un admin puede eliminar
    if (userRole !== "admin" && observation.created_by_user_id !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para eliminar esta observación"
      });
    }

    await req.db!.query("DELETE FROM task_observations WHERE id = ?", [id]);

    console.log(`[OBSERVATION] Observación ${id} eliminada por usuario ${userId}`);

    res.json({
      ok: true,
      message: "Observación eliminada exitosamente"
    });
  } catch (error: any) {
    console.error("Error deleting observation:", error);
    res.status(500).json({
      message: "Error al eliminar observación",
      error: error.message
    });
  }
}

/**
 * Función auxiliar: Calcular y actualizar overall_rating de un cliente
 * Se llama después de completar todas las tareas del mes
 */
export async function updateClientOverallRating(
  db: any,
  clientId: number,
  invoiceId: number
) {
  try {
    // Obtener todas las tareas del invoice
    const [tasks]: any = await db.query(
      "SELECT id FROM monthly_service_checklist WHERE invoice_id = ? AND status = 'completed'",
      [invoiceId]
    );

    const taskIds = tasks.map((t: any) => t.id);

    if (taskIds.length === 0) {
      console.log(`[RATING] No hay tareas completadas para invoice ${invoiceId}`);
      return;
    }

    // Obtener ratings del mes (solo los que tienen rating)
    const [ratings]: any = await db.query(
      `SELECT rating
       FROM task_observations
       WHERE task_id IN (?) AND rating IS NOT NULL`,
      [taskIds]
    );

    if (ratings.length === 0) {
      console.log(`[RATING] No hay ratings para calcular en invoice ${invoiceId}`);
      return;
    }

    // Calcular promedio del mes
    const monthlyAverage =
      ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;

    console.log(`[RATING] Promedio mensual para cliente ${clientId}: ${monthlyAverage.toFixed(2)}`);

    // Obtener overall_rating actual y ratings_count
    const [[profile]]: any = await db.query(
      "SELECT overall_rating, ratings_count FROM clients_profiles WHERE user_id = ?",
      [clientId]
    );

    if (!profile) {
      console.log(`[RATING] No se encontró perfil para cliente ${clientId}`);
      return;
    }

    const currentRating = profile.overall_rating || 0;
    const ratingsCount = profile.ratings_count || 0;

    // Calcular nuevo promedio ponderado
    const newRating =
      ratingsCount === 0
        ? monthlyAverage
        : (currentRating * ratingsCount + monthlyAverage) / (ratingsCount + 1);

    // Actualizar overall_rating y ratings_count
    await db.query(
      `UPDATE clients_profiles
       SET overall_rating = ?, ratings_count = ?
       WHERE user_id = ?`,
      [newRating, ratingsCount + 1, clientId]
    );

    console.log(
      `[RATING] Cliente ${clientId} actualizado: ${currentRating.toFixed(2)} → ${newRating.toFixed(2)} (${ratingsCount + 1} promedios)`
    );

    return newRating;
  } catch (error: any) {
    console.error("Error updating client overall rating:", error);
    throw error;
  }
}
