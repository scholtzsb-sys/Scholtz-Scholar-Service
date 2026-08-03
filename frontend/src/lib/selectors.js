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

// Returns { absent, stages }. A scholar marked absent today is terminal for
// the day — no further per-stage tracking applies, regardless of which
// stages (if any) were already logged before the absence was reported.
export function stageStatusForScholar(state, scholar) {
  const plan = TRANSPORT_PLANS[scholar.transportPlan];
  const events = todaysEventsFor(state, scholar.id);
  const absentEvent = events.find((e) => e.eventType === 'absent');
  if (absentEvent) {
    return { absent: true, absentAt: absentEvent.timestamp, stages: [] };
  }
  const stages = plan.stages.map((stage) => {
    const event = events.find((e) => e.eventType === stage);
    return { stage, done: Boolean(event), timestamp: event?.timestamp ?? null };
  });
  return { absent: false, stages };
}

// The next stage a driver still needs to tap for this scholar today, or
// null if they're absent or already done with every stage.
export function nextStageForScholar(state, scholar) {
  const { absent, stages } = stageStatusForScholar(state, scholar);
  if (absent) return null;
  return stages.find((st) => !st.done)?.stage ?? null;
}

export function driverTodayProgress(state, driverId) {
  const scholars = state.scholars.filter((s) => s.driverId === driverId && s.active);
  let total = 0;
  let done = 0;
  scholars.forEach((s) => {
    const { absent, stages } = stageStatusForScholar(state, s);
    if (absent) return; // excluded from the day's tally — nothing left to do
    total += stages.length;
    done += stages.filter((st) => st.done).length;
  });
  return { done, total, scholars };
}

export function scholarsUncollectedFromHomeToday(state) {
  return state.scholars.filter((s) => {
    if (!s.active) return false;
    const plan = TRANSPORT_PLANS[s.transportPlan];
    if (!plan.stages.includes('home_pickup')) return false;
    const { absent, stages } = stageStatusForScholar(state, s);
    if (absent) return false; // expected to be uncollected — not an alert
    return !stages.find((st) => st.stage === 'home_pickup')?.done;
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
