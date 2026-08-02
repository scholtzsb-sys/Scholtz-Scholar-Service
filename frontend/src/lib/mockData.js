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

// Matches backend/prisma/seed.js — all demo accounts share this password.
export const DEMO_PASSWORD = 'demo1234';
