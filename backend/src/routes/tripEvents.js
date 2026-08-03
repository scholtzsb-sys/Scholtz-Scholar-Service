import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendTripNotification } from '../lib/notificationService.js';
import { stubWhatsappClient } from '../lib/whatsappClient.js';

const router = Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get('/', requireAuth, async (req, res) => {
  const where = req.query.today ? { timestamp: { gte: startOfToday() } } : {};
  res.json(await prisma.tripEvent.findMany({ where, orderBy: { timestamp: 'asc' } }));
});

async function createTripEvent(scholarId, eventType, driverId) {
  const scholar = await prisma.scholar.findUnique({
    where: { id: scholarId },
    include: { guardianLinks: { include: { guardian: true } } },
  });
  if (!scholar) return null;

  const normalizedType = eventType.toLowerCase();

  const event = await prisma.tripEvent.create({
    data: { scholarId, eventType: eventType.toUpperCase(), driverId },
  });

  const guardians = scholar.guardianLinks.map((link) => ({
    id: link.guardian.id,
    phone: link.guardian.phone,
    notify: link.notify,
    lastInboundMessageAt: link.guardian.lastInboundMessageAt,
  }));

  const notifications = await sendTripNotification(stubWhatsappClient, scholar, normalizedType, event.timestamp, guardians);

  return { event, notifications };
}

// Trip tracking and notification delivery are decoupled by design: the
// event is always logged (feeds the owner dashboard/driver-detail history)
// regardless of any guardian's opt-in status — only the message send is
// gated, inside sendTripNotification.
router.post('/', requireAuth, async (req, res) => {
  const { scholarId, eventType } = req.body;
  if (!scholarId || !eventType) {
    return res.status(400).json({ error: 'scholarId and eventType are required' });
  }

  const driverId = req.session.role === 'driver' ? req.session.driverId : undefined;
  const result = await createTripEvent(scholarId, eventType, driverId);
  if (!result) return res.status(404).json({ error: 'Scholar not found' });

  res.status(201).json(result);
});

// Lets a driver clear an entire school's worth of scholars for the current
// stage in one tap (e.g. everyone dropped at the same school) instead of
// tapping each scholar individually.
router.post('/bulk', requireAuth, async (req, res) => {
  const { scholarIds, eventType } = req.body;
  if (!Array.isArray(scholarIds) || scholarIds.length === 0 || !eventType) {
    return res.status(400).json({ error: 'scholarIds (non-empty array) and eventType are required' });
  }

  const driverId = req.session.role === 'driver' ? req.session.driverId : undefined;
  const results = [];
  for (const scholarId of scholarIds) {
    const result = await createTripEvent(scholarId, eventType, driverId);
    if (result) results.push({ scholarId, ...result });
  }

  res.status(201).json({ results });
});

export default router;
