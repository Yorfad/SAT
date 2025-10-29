import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { upload } from "../config/upload";
import { listInvoicesByClient, createMonthlyInvoice, updateInvoicePayments, uploadInvoiceFile, downloadInvoiceFile } from "../controllers/invoice.controller";
import { createDefaultChecklist, markChecklistTask } from "../controllers/checklist.controller";


const router = Router();
router.use(authenticateToken);


router.get("/client/:clientId", requireRoles("admin","employee","client"), listInvoicesByClient);


router.post("/:clientId", requireRoles("admin","employee"), validate(z.object({ body: z.object({
invoice_year: z.number().int().min(2000),
invoice_month: z.number().int().min(1).max(12),
previous_debt: z.number().nonnegative().default(0),
monthly_fee: z.number().nonnegative(),
extras_fee: z.number().nonnegative().default(0),
extras_description: z.string().optional(),
due_date: z.string().optional()
}) })), createMonthlyInvoice);


router.patch("/:invoiceId/payments", requireRoles("admin","employee"), validate(z.object({ body: z.object({ amount_paid: z.number().nonnegative() }) })), updateInvoicePayments);


router.post("/files/upload/:invoiceId", requireRoles("admin","employee"), upload.single("file"), uploadInvoiceFile);
router.get("/files/:fileId", requireRoles("admin","employee","client"), downloadInvoiceFile);


router.post("/:invoiceId/checklist/default", requireRoles("admin","employee"), createDefaultChecklist);
router.patch("/checklist/:taskId", requireRoles("admin","employee"), markChecklistTask);

router.get("/:invoiceId/items", requireRoles("admin","employee","client"), async (req,res)=>{
  const { invoiceId } = req.params;
  const [rows] = await req.db!.query(
    `SELECT i.id, s.service_name, i.quantity, i.unit_price, i.subtotal
       FROM invoice_service_items i JOIN services s ON s.id=i.service_id
      WHERE i.invoice_id=? ORDER BY s.service_name`, [invoiceId]);
  res.json(rows);
});

router.get("/:invoiceId/artifacts", requireRoles("admin","employee","client"), async (req,res)=>{
  const { invoiceId } = req.params;
  const [rows]: any = await req.db!.query(
    `SELECT ia.id, ia.status, ia.uploaded_file_id, sa.code, sa.name
       FROM invoice_artifacts ia
       JOIN service_artifacts sa ON sa.id=ia.service_artifact_id
      WHERE ia.invoice_id=?`, [invoiceId]);
  res.json(rows);
});

router.patch("/artifacts/:artifactId", requireRoles("admin","employee"), async (req:any,res:any)=>{
  const { artifactId } = req.params;
  const { status, notes } = req.body; // 'approved' | 'rejected'
  await req.db!.query(`UPDATE invoice_artifacts SET status=COALESCE(?,status), notes=COALESCE(?,notes) WHERE id=?`,
                      [status, notes, artifactId]);
  res.json({ ok:true });
});

export default router;