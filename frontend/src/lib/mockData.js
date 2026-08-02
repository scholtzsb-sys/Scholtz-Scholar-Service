import { scholarColor } from './palette';

function todayAt(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Trip plans control which of the four daily stages apply to a scholar.
export const TRANSPORT_PLANS = {
  full: {
    value: 'full',
    label: 'Dropped at school and picked up at home',
    stages: ['home_pickup', 'school_dropoff', 'school_pickup', 'home_dropoff'],
  },
  morning: {
    value: 'morning',
    label: 'School drop-off only',
    stages: ['home_pickup', 'school_dropoff'],
  },
  afternoon: {
    value: 'afternoon',
    label: 'Home pick-up only',
    stages: ['school_pickup', 'home_dropoff'],
  },
};

export const STAGE_LABELS = {
  home_pickup: 'Picked up from home',
  school_dropoff: 'Dropped off at school',
  school_pickup: 'Picked up from school',
  home_dropoff: 'Dropped off at home',
};

export const STAGE_ACTION_LABELS = {
  home_pickup: 'Picked up',
  school_dropoff: 'Dropped at school',
  school_pickup: 'Picked up from school',
  home_dropoff: 'Dropped at home',
};

export const initialOwners = [
  { id: 'owner-1', name: 'Elias Scholtz', phone: '0835550142' },
];

export const initialSchools = [
  { id: 'school-1', name: 'Oakwood Primary' },
  { id: 'school-2', name: 'Fairview Primary' },
];

export const initialDrivers = [
  {
    id: 'driver-1',
    name: 'Elias Scholtz',
    phone: '0835550142',
    vehicleReg: 'CA 123-456',
    linkedOwnerId: 'owner-1',
    active: true,
    deactivatedAt: null,
  },
  {
    id: 'driver-2',
    name: 'Nomvula Khumalo',
    phone: '0821112233',
    vehicleReg: 'CA 987-654',
    linkedOwnerId: null,
    active: true,
    deactivatedAt: null,
  },
];

// Contact identity records — shared across siblings so invoice bundling and
// free-session tracking (a property of the guardian's phone) work correctly.
// The pickup/drop-off notify toggle is NOT here: it's per scholar-guardian
// link (see scholar.guardianLinks), since the same contact can want updates
// for one child and not another.
export const initialGuardians = [
  {
    id: 'guardian-1',
    name: 'Thandi Dlamini',
    phone: '0712345678',
    type: 'parent',
    isBillingContact: true,
    billingChannel: 'whatsapp',
    email: '',
    lastInboundMessageAt: null,
  },
  {
    id: 'guardian-2',
    name: 'Priya Naidoo',
    phone: '0739981122',
    type: 'parent',
    isBillingContact: true,
    billingChannel: 'email',
    email: 'priya.naidoo@example.com',
    lastInboundMessageAt: null,
  },
  {
    id: 'guardian-3',
    name: 'Vasanthi Naidoo',
    phone: '0731004455',
    type: 'guardian',
    isBillingContact: false,
    billingChannel: null,
    email: '',
    lastInboundMessageAt: todayAt(6, 50),
  },
  {
    id: 'guardian-4',
    name: 'Mari van Wyk',
    phone: '0824456677',
    type: 'parent',
    isBillingContact: true,
    billingChannel: 'whatsapp',
    email: '',
    lastInboundMessageAt: null,
  },
];

// Registration order determines color rotation — index is stored so it
// never shifts if a scholar is later deactivated.
export const initialScholars = [
  {
    id: 'scholar-1',
    name: 'Amara Dlamini',
    grade: '3',
    schoolId: 'school-1',
    homeAddress: '12 Fir Road, Claremont, Cape Town',
    photo: null,
    transportPlan: 'full',
    guardianLinks: [{ guardianId: 'guardian-1', notify: true }],
    driverId: 'driver-1',
    pickupOrder: 1,
    feePerMonth: 850,
    notifyAddon: true,
    colorIndex: 0,
    active: true,
    deactivatedAt: null,
  },
  {
    id: 'scholar-2',
    name: 'Sipho Dlamini Jr.',
    grade: '6',
    schoolId: 'school-1',
    homeAddress: '12 Fir Road, Claremont, Cape Town',
    photo: null,
    transportPlan: 'full',
    guardianLinks: [{ guardianId: 'guardian-1', notify: true }],
    driverId: 'driver-1',
    pickupOrder: 2,
    feePerMonth: 850,
    notifyAddon: false,
    colorIndex: 1,
    active: true,
    deactivatedAt: null,
  },
  {
    id: 'scholar-3',
    name: 'Kiara Naidoo',
    grade: '1',
    schoolId: 'school-2',
    homeAddress: '4 Palm Close, Rondebosch, Cape Town',
    photo: null,
    transportPlan: 'afternoon',
    guardianLinks: [
      { guardianId: 'guardian-2', notify: true },
      { guardianId: 'guardian-3', notify: true },
    ],
    driverId: 'driver-1',
    pickupOrder: 3,
    feePerMonth: 700,
    notifyAddon: false,
    colorIndex: 2,
    active: true,
    deactivatedAt: null,
  },
  {
    id: 'scholar-4',
    name: 'Liam van Wyk',
    grade: '4',
    schoolId: 'school-1',
    homeAddress: '9 Milkwood Ave, Newlands, Cape Town',
    photo: null,
    transportPlan: 'morning',
    guardianLinks: [{ guardianId: 'guardian-4', notify: true }],
    driverId: 'driver-2',
    pickupOrder: 1,
    feePerMonth: 800,
    notifyAddon: true,
    colorIndex: 3,
    active: true,
    deactivatedAt: null,
  },
  {
    id: 'scholar-5',
    name: 'Zoe van Wyk',
    grade: '7',
    schoolId: 'school-2',
    homeAddress: '9 Milkwood Ave, Newlands, Cape Town',
    photo: null,
    transportPlan: 'full',
    guardianLinks: [{ guardianId: 'guardian-4', notify: false }],
    driverId: 'driver-2',
    pickupOrder: 2,
    feePerMonth: 900,
    notifyAddon: true,
    colorIndex: 0,
    active: true,
    deactivatedAt: null,
  },
];

// Seeded so the dashboard has a realistic mid-morning story: some stages
// done, some scholars not yet collected from home.
export const initialTripEvents = [
  { id: 'trip-1', scholarId: 'scholar-1', eventType: 'home_pickup', timestamp: todayAt(7, 12) },
  { id: 'trip-2', scholarId: 'scholar-1', eventType: 'school_dropoff', timestamp: todayAt(7, 41) },
  { id: 'trip-3', scholarId: 'scholar-5', eventType: 'home_pickup', timestamp: todayAt(7, 5) },
];

export const initialInvoices = [
  {
    id: 'invoice-SSS-2026-0812',
    billingGuardianId: 'guardian-1',
    invoiceNumber: 'SSS-2026-0812',
    month: 'July 2026',
    issuedDate: '2026-07-01',
    dueDate: '2026-08-01',
    lineItems: [
      { scholarId: 'scholar-1', scholarName: 'Amara Dlamini', school: 'Oakwood Primary', transportPlan: 'full', amount: 850, notifyAddon: true, addonAmount: 100 },
      { scholarId: 'scholar-2', scholarName: 'Sipho Dlamini Jr.', school: 'Oakwood Primary', transportPlan: 'full', amount: 850, notifyAddon: false, addonAmount: 0 },
    ],
    subtotal: 1800,
    total: 1800,
    status: 'paid',
    proofOfPayment: { filename: 'dlamini_eft_proof.jpg' },
    paidAt: '2026-07-03T09:12:00',
  },
];

export function scholarWithColor(scholar) {
  return { ...scholar, color: scholarColor(scholar.colorIndex) };
}
