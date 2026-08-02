import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  res.json(await prisma.school.findMany({ orderBy: { name: 'asc' } }));
});

router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const school = await prisma.school.create({ data: { name } });
  res.status(201).json(school);
});

export default router;
