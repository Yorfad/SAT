import { Request, Response } from 'express';
import { RowDataPacket, OkPacket } from 'mysql2';
import pool from '../config/database';
import { MonthlyInvoice } from '../models/invoice.model';
type TenantRequest = Request & { tenantId?: number | string };
export const getInvoicesByClient = async (req: TenantRequest, res: Response) => {
  const clientId = req.params.clientId;
  const tenantId = req.tenantId!;
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM monthly_invoices WHERE tenant_id = ? AND client_user_id = ?',
      [tenantId, clientId]
    );
    
    const invoices = rows as MonthlyInvoice[];
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener facturas' });
  }
};

export const createInvoice = async (req: TenantRequest, res: Response) => {
  const { clientUserId, invoiceYear, invoiceMonth, monthlyFee, extrasFee, extrasDescription, dueDate } = req.body;
  const tenantId = req.tenantId!;
  
  try {
    const [result] = await pool.query<OkPacket>(
      'INSERT INTO monthly_invoices (tenant_id, client_user_id, invoice_year, invoice_month, monthly_fee, extras_fee, extras_description, total_due, balance, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, clientUserId, invoiceYear, invoiceMonth, monthlyFee, extrasFee, extrasDescription, monthlyFee + extrasFee, monthlyFee + extrasFee, dueDate]
    );
    
    const invoiceId = result.insertId;
    
    res.status(201).json({ success: true, message: 'Factura creada exitosamente', invoiceId });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ success: false, message: 'Error al crear factura' });
  }
};