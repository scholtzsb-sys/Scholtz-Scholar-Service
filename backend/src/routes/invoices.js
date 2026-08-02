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

function monthLabel(date) {
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

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
    include: { lineItems: true, billingGuardian: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  res.json(invoice);
});

// Bundles every scholar the caller lists (expected to be every active
// scholar sharing the same billing guardian) into one family invoice.
// Line items snapshot scholar name/school/plan at generation time so this
// invoice stays accurate even if the scholar is edited or deleted later.
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const { billingGuardianId, lineItems } = req.body;
  if (!billingGuardianId || !Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ error: 'billingGuardianId and at least one line item are required' });
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
      month: monthLabel(issuedDate),
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

// Reversible. Marking paid (but not unmarking) fires a "payment received"
// confirmation — proof-of-payment attachment and paid status are
// intentionally independent of each other.
router.post('/:id/paid', requireAuth, requireRole('owner'), async (req, res) => {
  const { paid } = req.body;
  const existing = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { billingGuardian: true },
  });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const becomingPaid = paid && existing.status !== 'PAID';

  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status: paid ? 'PAID' : 'UNPAID', paidAt: paid ? new Date() : null },
    include: { lineItems: true },
  });

  if (becomingPaid) {
    await stubWhatsappClient.sendTemplateMessage(existing.billingGuardian.phone, 'payment_received', {
      invoiceNumber: invoice.invoiceNumber,
    });
  }

  res.json(invoice);
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
