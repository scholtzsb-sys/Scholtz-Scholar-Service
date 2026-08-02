import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import schoolRoutes from './routes/schools.js';
import guardianRoutes from './routes/guardians.js';
import ownerRoutes from './routes/owners.js';
import driverRoutes from './routes/drivers.js';
import scholarRoutes from './routes/scholars.js';
import tripEventRoutes from './routes/tripEvents.js';
import invoiceRoutes from './routes/invoices.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/scholars', scholarRoutes);
app.use('/api/trip-events', tripEventRoutes);
app.use('/api/invoices', invoiceRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
