import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { omitPassword } from '../lib/sanitize.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(drivers.map(omitPassword));
});

router.get('/:id', requireAuth, async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) return res.status(404).json({ error: 'Not found' });
  res.json(omitPassword(driver));
});

// Ordered list of scholar ids becomes each scholar's pickupOrder (1-based).
// Any scholar previously assigned to this driver but missing from the list
// is unassigned, mirroring the frontend's ScholarAssignmentPicker.
async function applyAssignment(driverId, assignedScholarIds) {
  if (!assignedScholarIds) return;
  await prisma.scholar.updateMany({
    where: { driverId, id: { notIn: assignedScholarIds } },
    data: { driverId: null, pickupOrder: null },
  });
  for (let i = 0; i < assignedScholarIds.length; i++) {
    await prisma.scholar.update({ where: { id: assignedScholarIds[i] }, data: { driverId, pickupOrder: i + 1 } });
  }
}

router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const { name, phone, password, vehicleReg, assignedScholarIds } = req.body;
  if (!name || !phone || !password || !vehicleReg) {
    return res.status(400).json({ error: 'name, phone, password, and vehicleReg are required' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const driver = await prisma.driver.create({ data: { name, phone, password: hashed, vehicleReg } });
  await applyAssignment(driver.id, assignedScholarIds || []);
  res.status(201).json(omitPassword(driver));
});

router.patch('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, password, vehicleReg, assignedScholarIds } = req.body;

  const data = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (vehicleReg !== undefined) data.vehicleReg = vehicleReg;
  if (password) data.password = await bcrypt.hash(password, 10);

  const driver = await prisma.driver.update({ where: { id }, data });
  await applyAssignment(id, assignedScholarIds);
  res.json(omitPassword(driver));
});

router.post('/:id/deactivate', requireAuth, requireRole('owner'), async (req, res) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { active: false, deactivatedAt: new Date() },
  });
  res.json(omitPassword(driver));
});

router.post('/:id/reactivate', requireAuth, requireRole('owner'), async (req, res) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { active: true, deactivatedAt: null },
  });
  res.json(omitPassword(driver));
});

router.delete('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
