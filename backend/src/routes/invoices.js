import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { stubWhatsappClient } from '../lib/whatsappClient.js';

const router = Router();

const PLAN_LABELS = {
  FULL: 'Drop-off & pick-up',
  MORNING: 'School drop-off only',
  AFTERNOON: 'Home pick-up only',
};

async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  return `SSS-${new Date().getFullYear()}-${count + 801}`;
}

router.get('/family/:billingGuardianId', requireAuth, async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { billingGuardianId: req.params.billingGuardianId },
    include: { lineItems: true },
    orderBy: { issuedDate: 'desc' },
  });
  res.json(invoices);
});

router.get('/:id', requireAuth, async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { lineItems: true, billingGuardian: true, payments: { orderBy: { paidAt: 'asc' } } },
  });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  res.json(invoice);
});

// Bundles every scholar the caller lists (expected to be every active
// scholar sharing the same billing guardian) into one family invoice, for
// the period the owner chose. Line items snapshot scholar name/school/plan
// at generation time so this invoice stays accurate even if the scholar is
// edited or deleted later. The frontend only calls this once the owner has
// confirmed the preview and clicked "Send" — this call both creates and
// delivers the invoice in one step.
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const { billingGuardianId, periodStart, periodEnd, lineItems } = req.body;
  if (!billingGuardianId || !periodStart || !periodEnd || !Array.isArray(lineItems) || lineItems.length === 0) {
    return res
      .status(400)
      .json({ error: 'billingGuardianId, periodStart, periodEnd, and at least one line item are required' });
  }

  const billingGuardian = await prisma.guardian.findUnique({ where: { id: billingGuardianId } });
  if (!billingGuardian) return res.status(404).json({ error: 'Billing guardian not found' });

  const scholars = await prisma.scholar.findMany({
    where: { id: { in: lineItems.map((li) => li.scholarId) } },
    include: { school: true },
  });
  const scholarById = new Map(scholars.map((s) => [s.id, s]));

  const resolvedLineItems = lineItems.map((li) => {
    const scholar = scholarById.get(li.scholarId);
    const addonAmount = scholar?.notifyAddon ? 100 : 0;
    return {
      scholarId: li.scholarId,
      scholarName: scholar?.name ?? 'Unknown scholar',
      school: scholar?.school?.name ?? 'Unknown school',
      transportPlan: PLAN_LABELS[scholar?.transportPlan] ?? '',
      amount: Number(li.amount) || 0,
      notifyAddon: Boolean(scholar?.notifyAddon),
      addonAmount,
    };
  });
  const subtotal = resolvedLineItems.reduce((sum, li) => sum + li.amount + li.addonAmount, 0);

  const issuedDate = new Date();
  const dueDate = new Date(issuedDate);
  dueDate.setMonth(dueDate.getMonth() + 1);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await nextInvoiceNumber(),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      issuedDate,
      dueDate,
      subtotal,
      total: subtotal,
      billingGuardianId,
      lineItems: { create: resolvedLineItems },
    },
    include: { lineItems: true },
  });

  const channel = billingGuardian.billingChannel === 'EMAIL' ? 'email' : 'whatsapp';
  if (channel === 'whatsapp') {
    await stubWhatsappClient.sendTemplateMessage(billingGuardian.phone, 'invoice_delivery', {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
    });
  } else {
    console.log(`[stub-email:invoice_delivery] -> ${billingGuardian.email}: invoice ${invoice.invoiceNumber}, R${invoice.total}`);
  }

  res.status(201).json({ invoice, deliveredVia: channel });
});

// Records one payment transaction (full or partial — the frontend decides
// which amount to send). Invoices are never rolled into the next period;
// an outstanding balance just stays outstanding on this invoice. Fires the
// "payment received" notification only the moment the invoice first
// reaches PAID — not on every partial installment.
router.post('/:id/payments', requireAuth, requireRole('owner'), async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be greater than 0' });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { billingGuardian: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Not found' });

  const payment = await prisma.payment.create({ data: { amount: Number(amount), invoiceId: invoice.id } });

  const newAmountPaid = invoice.amountPaid + Number(amount);
  const newStatus = newAmountPaid >= invoice.total ? 'PAID' : newAmountPaid > 0 ? 'PARTIAL' : 'UNPAID';
  const becamePaid = newStatus === 'PAID' && invoice.status !== 'PAID';

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid: newAmountPaid,
      status: newStatus,
      paidAt: becamePaid ? new Date() : invoice.paidAt,
    },
    include: { lineItems: true, payments: { orderBy: { paidAt: 'asc' } }, billingGuardian: true },
  });

  if (becamePaid) {
    await stubWhatsappClient.sendTemplateMessage(invoice.billingGuardian.phone, 'payment_received', {
      invoiceNumber: invoice.invoiceNumber,
    });
  }

  res.status(201).json({ payment, invoice: updated });
});

router.post('/:id/proof', requireAuth, requireRole('owner'), async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename is required' });
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { proofOfPaymentFilename: filename },
  });
  res.json(invoice);
});

export default router;
