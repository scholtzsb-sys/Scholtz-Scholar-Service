import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signSession } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lets the frontend decide whether to show the login form or the
// one-time "create the first owner" bootstrap screen.
router.get('/owners-exist', async (req, res) => {
  const count = await prisma.owner.count();
  res.json({ exists: count > 0 });
});

router.post('/first-owner', async (req, res) => {
  const { name, phone, password, alsoDrives, vehicleReg } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone, and password are required' });
  }

  const existingOwners = await prisma.owner.count();
  if (existingOwners > 0) {
    return res.status(409).json({ error: 'An owner already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const owner = await prisma.owner.create({ data: { name, phone, password: hashed } });

  if (alsoDrives) {
    await prisma.driver.create({
      data: { name, phone, password: hashed, vehicleReg: vehicleReg || '', linkedOwnerId: owner.id },
    });
  }

  const session = { role: 'owner', ownerId: owner.id, phone: owner.phone, name: owner.name };
  res.status(201).json({ token: signSession(session), session });
});

// Single-screen phone+password login. A phone held by the same person as
// both owner and driver shares one password (see first-owner/add-owner),
// so a correct login can resolve to one or two roles.
router.post('/login', async (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }

  const owner = await prisma.owner.findUnique({ where: { phone } });
  const driver = await prisma.driver.findFirst({ where: { phone, active: true } });

  const ownerMatch = owner && (await bcrypt.compare(password, owner.password));
  const driverMatch = driver && (await bcrypt.compare(password, driver.password));

  const roles = [];
  if (ownerMatch) roles.push({ role: 'owner', ownerId: owner.id, name: owner.name, label: `Owner — ${owner.name}` });
  if (driverMatch) roles.push({ role: 'driver', driverId: driver.id, name: driver.name, label: `Driver — ${driver.name}` });

  if (roles.length === 0) {
    const anyAccount = Boolean(owner) || Boolean(driver);
    return res
      .status(401)
      .json({ error: anyAccount ? 'Incorrect password.' : 'No owner or driver account found for this number.' });
  }

  if (roles.length > 1 && !role) {
    // Ask the client to pick a role, mirroring the frontend's "Continue as…" screen.
    return res.json({ roles: roles.map(({ role, label }) => ({ role, label })) });
  }

  const chosen = roles.length > 1 ? roles.find((r) => r.role === role) : roles[0];
  if (!chosen) return res.status(400).json({ error: 'Invalid role selection' });

  const session = { role: chosen.role, ownerId: chosen.ownerId, driverId: chosen.driverId, phone, name: chosen.name };
  res.json({ token: signSession(session), session });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ session: req.session });
});

export default router;
