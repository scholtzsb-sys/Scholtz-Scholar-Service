import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const scholarInclude = {
  school: true,
  driver: true,
  guardianLinks: { include: { guardian: true } },
};

router.get('/', requireAuth, async (req, res) => {
  res.json(await prisma.scholar.findMany({ include: scholarInclude, orderBy: { createdAt: 'asc' } }));
});

router.get('/:id', requireAuth, async (req, res) => {
  const scholar = await prisma.scholar.findUnique({ where: { id: req.params.id }, include: scholarInclude });
  if (!scholar) return res.status(404).json({ error: 'Not found' });
  res.json(scholar);
});

function toBillingChannel(g) {
  if (!g.isBillingContact) return null;
  return g.billingChannel === 'email' ? 'EMAIL' : 'WHATSAPP';
}

// Each entry is either { guardianId, notify, ...editedFields } for an
// existing contact (used by the sibling shortcut, or when editing) — which
// also pushes the edited fields onto the shared Guardian record — or
// { notify, name, phone, type, ... } with no guardianId to create a brand
// new contact. Returns nested-write data for Scholar's guardianLinks.
async function resolveGuardianLinks(guardianLinks) {
  const links = [];
  for (const g of guardianLinks || []) {
    if (g.guardianId) {
      await prisma.guardian.update({
        where: { id: g.guardianId },
        data: {
          name: g.name,
          phone: g.phone,
          isBillingContact: Boolean(g.isBillingContact),
          billingChannel: toBillingChannel(g),
          email: g.isBillingContact && g.billingChannel === 'email' ? g.email || null : null,
        },
      });
      links.push({ notify: g.notify ?? true, guardian: { connect: { id: g.guardianId } } });
    } else {
      links.push({
        notify: g.notify ?? true,
        guardian: {
          create: {
            name: g.name,
            phone: g.phone,
            type: g.type === 'guardian' ? 'GUARDIAN' : 'PARENT',
            isBillingContact: Boolean(g.isBillingContact),
            billingChannel: toBillingChannel(g),
            email: g.isBillingContact && g.billingChannel === 'email' ? g.email || null : null,
          },
        },
      });
    }
  }
  return links;
}

router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const { name, grade, schoolId, homeAddress, transportPlan, feePerMonth, notifyAddon, guardianLinks } = req.body;
  if (!name || !schoolId || !homeAddress || !transportPlan) {
    return res.status(400).json({ error: 'name, schoolId, homeAddress, and transportPlan are required' });
  }

  const colorIndex = await prisma.scholar.count();
  const links = await resolveGuardianLinks(guardianLinks);

  const scholar = await prisma.scholar.create({
    data: {
      name,
      grade,
      schoolId,
      homeAddress,
      transportPlan: transportPlan.toUpperCase(),
      feePerMonth: feePerMonth || 0,
      notifyAddon: Boolean(notifyAddon),
      colorIndex,
      guardianLinks: { create: links },
    },
    include: scholarInclude,
  });
  res.status(201).json(scholar);
});

router.patch('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  const { id } = req.params;
  const { name, grade, schoolId, homeAddress, transportPlan, feePerMonth, notifyAddon, guardianLinks } = req.body;

  const data = {};
  if (name !== undefined) data.name = name;
  if (grade !== undefined) data.grade = grade;
  if (schoolId !== undefined) data.schoolId = schoolId;
  if (homeAddress !== undefined) data.homeAddress = homeAddress;
  if (transportPlan !== undefined) data.transportPlan = transportPlan.toUpperCase();
  if (feePerMonth !== undefined) data.feePerMonth = feePerMonth;
  if (notifyAddon !== undefined) data.notifyAddon = Boolean(notifyAddon);

  if (guardianLinks) {
    const links = await resolveGuardianLinks(guardianLinks);
    await prisma.guardianLink.deleteMany({ where: { scholarId: id } });
    data.guardianLinks = { create: links };
  }

  const scholar = await prisma.scholar.update({ where: { id }, data, include: scholarInclude });
  res.json(scholar);
});

router.post('/:id/deactivate', requireAuth, requireRole('owner'), async (req, res) => {
  const scholar = await prisma.scholar.update({
    where: { id: req.params.id },
    data: { active: false, deactivatedAt: new Date() },
  });
  res.json(scholar);
});

router.post('/:id/reactivate', requireAuth, requireRole('owner'), async (req, res) => {
  const scholar = await prisma.scholar.update({
    where: { id: req.params.id },
    data: { active: true, deactivatedAt: null },
  });
  res.json(scholar);
});

router.delete('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  await prisma.scholar.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
