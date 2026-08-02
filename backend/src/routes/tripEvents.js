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

// Trip tracking and notification delivery are decoupled by design: the
// event is always logged (feeds the owner dashboard/driver-detail history)
// regardless of any guardian's opt-in status — only the message send is
// gated, inside sendTripNotification.
router.post('/', requireAuth, async (req, res) => {
  const { scholarId, eventType } = req.body;
  if (!scholarId || !eventType) {
    return res.status(400).json({ error: 'scholarId and eventType are required' });
  }

  const scholar = await prisma.scholar.findUnique({
    where: { id: scholarId },
    include: { guardianLinks: { include: { guardian: true } } },
  });
  if (!scholar) return res.status(404).json({ error: 'Scholar not found' });

  const driverId = req.session.role === 'driver' ? req.session.driverId : undefined;
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

  res.status(201).json({ event, notifications });
});

export default router;
