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

  let driver = null;
  if (alsoDrives) {
    driver = await prisma.driver.create({
      data: { name, phone, password: hashed, vehicleReg: vehicleReg || '', linkedOwnerId: owner.id },
    });
  }

  const availableRoles = driver ? ['owner', 'driver'] : ['owner'];
  const session = { role: 'owner', ownerId: owner.id, phone: owner.phone, name: owner.name, availableRoles };
  res.status(201).json({ token: signSession(session), session });
});

// Finds every role (owner and/or driver) tied to a phone number, regardless
// of password — used both to resolve login and to validate a role switch
// for an already-authenticated session.
async function resolveRolesForPhone(phone) {
  const owner = await prisma.owner.findUnique({ where: { phone } });
  const driver = await prisma.driver.findFirst({ where: { phone, active: true } });
  const roles = [];
  if (owner) roles.push({ role: 'owner', ownerId: owner.id, name: owner.name, label: `Owner — ${owner.name}` });
  if (driver) roles.push({ role: 'driver', driverId: driver.id, name: driver.name, label: `Driver — ${driver.name}` });
  return { owner, driver, roles };
}

// Single-screen phone+password login. A phone held by the same person as
// both owner and driver shares one password (see first-owner/add-owner),
// so a correct login can resolve to one or two roles.
router.post('/login', async (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }

  const { owner, driver, roles } = await resolveRolesForPhone(phone);
  const ownerMatch = owner && (await bcrypt.compare(password, owner.password));
  const driverMatch = driver && (await bcrypt.compare(password, driver.password));
  const matchedRoles = roles.filter((r) => (r.role === 'owner' ? ownerMatch : driverMatch));

  if (matchedRoles.length === 0) {
    const anyAccount = Boolean(owner) || Boolean(driver);
    return res
      .status(401)
      .json({ error: anyAccount ? 'Incorrect password.' : 'No owner or driver account found for this number.' });
  }

  if (matchedRoles.length > 1 && !role) {
    // Ask the client to pick a role, mirroring the frontend's "Continue as…" screen.
    return res.json({ roles: matchedRoles.map(({ role, label }) => ({ role, label })) });
  }

  const chosen = matchedRoles.length > 1 ? matchedRoles.find((r) => r.role === role) : matchedRoles[0];
  if (!chosen) return res.status(400).json({ error: 'Invalid role selection' });

  const availableRoles = matchedRoles.map((r) => r.role);
  const session = { role: chosen.role, ownerId: chosen.ownerId, driverId: chosen.driverId, phone, name: chosen.name, availableRoles };
  res.json({ token: signSession(session), session });
});

// Lets someone already logged in as owner (or driver) flip to their other
// role on the same phone number without re-entering a password — the
// existing JWT already proves they own that phone.
router.post('/switch-role', requireAuth, async (req, res) => {
  const { role } = req.body;
  if (role !== 'owner' && role !== 'driver') {
    return res.status(400).json({ error: 'role must be "owner" or "driver"' });
  }

  const { roles } = await resolveRolesForPhone(req.session.phone);
  const chosen = roles.find((r) => r.role === role);
  if (!chosen) return res.status(403).json({ error: `No ${role} account found for this number.` });

  const availableRoles = roles.map((r) => r.role);
  const session = {
    role: chosen.role,
    ownerId: chosen.ownerId,
    driverId: chosen.driverId,
    phone: req.session.phone,
    name: chosen.name,
    availableRoles,
  };
  res.json({ token: signSession(session), session });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ session: req.session });
});

export default router;
