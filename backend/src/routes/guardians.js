import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  res.json(await prisma.guardian.findMany());
});

router.get('/:id', requireAuth, async (req, res) => {
  const guardian = await prisma.guardian.findUnique({ where: { id: req.params.id } });
  if (!guardian) return res.status(404).json({ error: 'Not found' });
  res.json(guardian);
});

export default router;
