import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same demo dataset as the frontend mock (frontend/src/lib/mockData.js),
// so the backend and the standalone frontend mock tell the same story
// while both are in play during this transition.
const DEMO_PASSWORD = 'demo1234';

function todayAt(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function wipe() {
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.tripEvent.deleteMany();
  await prisma.guardianLink.deleteMany();
  await prisma.scholar.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.school.deleteMany();
}

async function main() {
  await wipe();

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  const owner = await prisma.owner.create({
    data: { name: 'Elias Scholtz', phone: '0835550142', password: hashed },
  });
  const driver1 = await prisma.driver.create({
    data: {
      name: 'Elias Scholtz',
      phone: '0835550142',
      password: hashed,
      vehicleReg: 'CA 123-456',
      linkedOwnerId: owner.id,
    },
  });
  const driver2 = await prisma.driver.create({
    data: { name: 'Nomvula Khumalo', phone: '0821112233', password: hashed, vehicleReg: 'CA 987-654' },
  });

  const oakwood = await prisma.school.create({ data: { name: 'Oakwood Primary' } });
  const fairview = await prisma.school.create({ data: { name: 'Fairview Primary' } });

  const thandi = await prisma.guardian.create({
    data: { name: 'Thandi Dlamini', phone: '0712345678', type: 'PARENT', isBillingContact: true, billingChannel: 'WHATSAPP' },
  });
  const priya = await prisma.guardian.create({
    data: {
      name: 'Priya Naidoo',
      phone: '0739981122',
      type: 'PARENT',
      isBillingContact: true,
      billingChannel: 'EMAIL',
      email: 'priya.naidoo@example.com',
    },
  });
  const vasanthi = await prisma.guardian.create({
    data: {
      name: 'Vasanthi Naidoo',
      phone: '0731004455',
      type: 'GUARDIAN',
      isBillingContact: false,
      // Inside the 24h free-session window, to exercise that code path.
      lastInboundMessageAt: todayAt(6, 50),
    },
  });
  const mari = await prisma.guardian.create({
    data: { name: 'Mari van Wyk', phone: '0824456677', type: 'PARENT', isBillingContact: true, billingChannel: 'WHATSAPP' },
  });

  const amara = await prisma.scholar.create({
    data: {
      name: 'Amara Dlamini',
      grade: '3',
      schoolId: oakwood.id,
      homeAddress: '12 Fir Road, Claremont, Cape Town',
      transportPlan: 'FULL',
      colorIndex: 0,
      driverId: driver1.id,
      pickupOrder: 1,
      feePerMonth: 850,
      notifyAddon: true,
      guardianLinks: { create: [{ guardianId: thandi.id, notify: true }] },
    },
  });
  const sipho = await prisma.scholar.create({
    data: {
      name: 'Sipho Dlamini Jr.',
      grade: '6',
      schoolId: oakwood.id,
      homeAddress: '12 Fir Road, Claremont, Cape Town',
      transportPlan: 'FULL',
      colorIndex: 1,
      driverId: driver1.id,
      pickupOrder: 2,
      feePerMonth: 850,
      notifyAddon: false,
      guardianLinks: { create: [{ guardianId: thandi.id, notify: true }] },
    },
  });
  await prisma.scholar.create({
    data: {
      name: 'Kiara Naidoo',
      grade: '1',
      schoolId: fairview.id,
      homeAddress: '4 Palm Close, Rondebosch, Cape Town',
      transportPlan: 'AFTERNOON',
      colorIndex: 2,
      driverId: driver1.id,
      pickupOrder: 3,
      feePerMonth: 700,
      notifyAddon: false,
      guardianLinks: {
        create: [
          { guardianId: priya.id, notify: true },
          { guardianId: vasanthi.id, notify: true },
        ],
      },
    },
  });
  await prisma.scholar.create({
    data: {
      name: 'Liam van Wyk',
      grade: '4',
      schoolId: oakwood.id,
      homeAddress: '9 Milkwood Ave, Newlands, Cape Town',
      transportPlan: 'MORNING',
      colorIndex: 3,
      driverId: driver2.id,
      pickupOrder: 1,
      feePerMonth: 800,
      notifyAddon: true,
      guardianLinks: { create: [{ guardianId: mari.id, notify: true }] },
    },
  });
  const zoe = await prisma.scholar.create({
    data: {
      name: 'Zoe van Wyk',
      grade: '7',
      schoolId: fairview.id,
      homeAddress: '9 Milkwood Ave, Newlands, Cape Town',
      transportPlan: 'FULL',
      colorIndex: 0,
      driverId: driver2.id,
      pickupOrder: 2,
      feePerMonth: 900,
      notifyAddon: true,
      guardianLinks: { create: [{ guardianId: mari.id, notify: false }] },
    },
  });

  // Mid-morning story: some stages done, some scholars not yet collected —
  // matches the frontend mock exactly so the dashboard reads the same way.
  await prisma.tripEvent.createMany({
    data: [
      { scholarId: amara.id, eventType: 'HOME_PICKUP', timestamp: todayAt(7, 12), driverId: driver1.id },
      { scholarId: amara.id, eventType: 'SCHOOL_DROPOFF', timestamp: todayAt(7, 41), driverId: driver1.id },
      { scholarId: zoe.id, eventType: 'HOME_PICKUP', timestamp: todayAt(7, 5), driverId: driver2.id },
    ],
  });

  // A settled invoice from last month, matching invoice_dlamini_family.pdf.
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'SSS-2026-0812',
      month: 'July 2026',
      issuedDate: new Date('2026-07-01'),
      dueDate: new Date('2026-08-01'),
      subtotal: 1800,
      total: 1800,
      status: 'PAID',
      paidAt: new Date('2026-07-03T09:12:00'),
      proofOfPaymentFilename: 'dlamini_eft_proof.jpg',
      billingGuardianId: thandi.id,
      lineItems: {
        create: [
          {
            scholarId: amara.id,
            scholarName: 'Amara Dlamini',
            school: 'Oakwood Primary',
            transportPlan: 'Drop-off & pick-up',
            amount: 850,
            notifyAddon: true,
            addonAmount: 100,
          },
          {
            scholarId: sipho.id,
            scholarName: 'Sipho Dlamini Jr.',
            school: 'Oakwood Primary',
            transportPlan: 'Drop-off & pick-up',
            amount: 850,
            notifyAddon: false,
            addonAmount: 0,
          },
        ],
      },
    },
  });

  console.log('Seed complete.');
  console.log(`All demo accounts use password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
