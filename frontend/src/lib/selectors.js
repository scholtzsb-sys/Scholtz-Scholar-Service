import { TRANSPORT_PLANS } from './mockData';
import { scholarColor } from './palette';

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function todaysEventsFor(state, scholarId) {
  return state.tripEvents.filter((e) => e.scholarId === scholarId && isSameDay(e.timestamp, new Date()));
}

export function stageStatusForScholar(state, scholar) {
  const plan = TRANSPORT_PLANS[scholar.transportPlan];
  const events = todaysEventsFor(state, scholar.id);
  return plan.stages.map((stage) => {
    const event = events.find((e) => e.eventType === stage);
    return { stage, done: Boolean(event), timestamp: event?.timestamp ?? null };
  });
}

export function driverTodayProgress(state, driverId) {
  const scholars = state.scholars.filter((s) => s.driverId === driverId && s.active);
  let total = 0;
  let done = 0;
  scholars.forEach((s) => {
    const statuses = stageStatusForScholar(state, s);
    total += statuses.length;
    done += statuses.filter((st) => st.done).length;
  });
  return { done, total, scholars };
}

export function scholarsUncollectedFromHomeToday(state) {
  return state.scholars.filter((s) => {
    if (!s.active) return false;
    const plan = TRANSPORT_PLANS[s.transportPlan];
    if (!plan.stages.includes('home_pickup')) return false;
    const events = todaysEventsFor(state, s.id);
    return !events.some((e) => e.eventType === 'home_pickup');
  });
}

// Merges each linked contact record with the notify flag scoped to *this*
// scholar — the same contact can be notified for one child and not another.
export function hasFreeSessionWindow(guardian) {
  if (!guardian?.lastInboundMessageAt) return false;
  const elapsed = Date.now() - new Date(guardian.lastInboundMessageAt).getTime();
  return elapsed < 24 * 60 * 60 * 1000;
}

export function guardiansForScholar(state, scholar) {
  return scholar.guardianLinks
    .map((link) => {
      const contact = state.guardians.find((g) => g.id === link.guardianId);
      return contact ? { ...contact, notify: link.notify } : null;
    })
    .filter(Boolean);
}

export function billingGuardianForScholar(state, scholar) {
  const guardians = guardiansForScholar(state, scholar);
  return guardians.find((g) => g.isBillingContact) ?? null;
}

export function schoolName(state, schoolId) {
  return state.schools.find((s) => s.id === schoolId)?.name ?? 'Unknown school';
}

export function driverName(state, driverId) {
  return state.drivers.find((d) => d.id === driverId)?.name ?? 'Unassigned';
}

export function withColor(scholar) {
  return { ...scholar, color: scholarColor(scholar.colorIndex) };
}
