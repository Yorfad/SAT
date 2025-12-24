import mysql from 'mysql2/promise';

export class ClientService {
  constructor(private db: mysql.Pool) {}

  /**
   * Asigna automáticamente los servicios por defecto (assignment_type = 'all_clients')
   * a un cliente recién creado.
   * @param clientUserId - ID del usuario cliente
   * @param workspaceId - ID del workspace (opcional, para filtrar servicios específicos del workspace)
   */
  async assignDefaultServices(clientUserId: number, workspaceId?: number): Promise<number> {
    // Obtener servicios con assignment_type = 'all_clients' que estén activos
    // Incluye servicios globales y del workspace específico
    let query = `
      SELECT id, service_name, default_price
      FROM services
      WHERE assignment_type = 'all_clients'
        AND is_active = 1
    `;

    const params: any[] = [];

    if (workspaceId) {
      query += ` AND (is_global = 1 OR workspace_id = ?)`;
      params.push(workspaceId);
    } else {
      query += ` AND is_global = 1`;
    }

    const [services]: any = await this.db.query(query, params);

    if (services.length === 0) {
      console.log(`[ClientService] No hay servicios por defecto para asignar al cliente ${clientUserId}`);
      return 0;
    }

    let assignedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const service of services) {
      // Verificar si ya tiene el servicio asignado
      const [existing]: any = await this.db.query(
        'SELECT id FROM client_services WHERE client_user_id = ? AND service_id = ?',
        [clientUserId, service.id]
      );

      if (existing.length === 0) {
        // Asignar el servicio
        await this.db.query(
          `INSERT INTO client_services (client_user_id, service_id, custom_price, status, start_date)
           VALUES (?, ?, ?, 'active', ?)`,
          [clientUserId, service.id, service.default_price, today]
        );
        assignedCount++;
        console.log(`[ClientService] Asignado servicio "${service.service_name}" al cliente ${clientUserId}`);
      }
    }

    console.log(`[ClientService] Total servicios asignados al cliente ${clientUserId}: ${assignedCount}`);
    return assignedCount;
  }

  /**
   * Obtiene los servicios asignados a un cliente
   */
  async getClientServices(clientUserId: number): Promise<any[]> {
    const [services]: any = await this.db.query(
      `SELECT cs.id, cs.service_id, s.service_name, s.description,
              COALESCE(cs.custom_price, s.default_price) as price,
              cs.status, cs.start_date
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       WHERE cs.client_user_id = ?
       ORDER BY s.service_name`,
      [clientUserId]
    );
    return services;
  }

  /**
   * Verifica si un cliente tiene todos los servicios por defecto asignados
   */
  async hasAllDefaultServices(clientUserId: number): Promise<boolean> {
    const [defaultServices]: any = await this.db.query(
      `SELECT COUNT(*) as total FROM services WHERE assignment_type = 'all_clients' AND is_active = 1`
    );

    const [clientDefaultServices]: any = await this.db.query(
      `SELECT COUNT(*) as total
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       WHERE cs.client_user_id = ?
         AND s.assignment_type = 'all_clients'
         AND cs.status = 'active'`,
      [clientUserId]
    );

    return clientDefaultServices[0].total >= defaultServices[0].total;
  }
}
