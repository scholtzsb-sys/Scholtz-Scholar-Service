import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { omitPassword } from '../lib/sanitize.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const owners = await prisma.owner.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(owners.map(omitPassword));
});

// Mirrors AddOwnerScreen: same name/phone/"also drives" pattern as the
// first-owner bootstrap, but this one supports scholar assignment since
// scholars already exist by the time a second owner is being added.
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const { name, phone, password, alsoDrives, vehicleReg, assignedScholarIds } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone, and password are required' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const owner = await prisma.owner.create({ data: { name, phone, password: hashed } });

  let driver = null;
  if (alsoDrives) {
    driver = await prisma.driver.create({
      data: { name, phone, password: hashed, vehicleReg: vehicleReg || '', linkedOwnerId: owner.id },
    });
    const ids = assignedScholarIds || [];
    for (let i = 0; i < ids.length; i++) {
      await prisma.scholar.update({ where: { id: ids[i] }, data: { driverId: driver.id, pickupOrder: i + 1 } });
    }
  }

  res.status(201).json({ owner: omitPassword(owner), driver: omitPassword(driver) });
});

export default router;
