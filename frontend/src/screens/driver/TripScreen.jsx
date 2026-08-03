import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentDriver } from '../../state/hooks';
import { stageStatusForScholar, schoolName } from '../../lib/selectors';
import { STAGE_ACTION_LABELS } from '../../lib/mockData';
import { initials } from '../../lib/palette';
import './driver.css';

// Only these stages get a bulk shortcut — school runs commonly carry
// several scholars at once, home addresses generally don't.
const SCHOOL_STAGES = new Set(['school_dropoff', 'school_pickup']);

export default function TripScreen() {
  const { state } = useApp();
  const { logTripEvent, logBulkTripEvent } = useAppActions();
  const driver = useCurrentDriver();
  const [lastAction, setLastAction] = useState(null);

  const stops = state.scholars
    .filter((s) => s.driverId === driver?.id && s.active)
    .sort((a, b) => (a.pickupOrder ?? 0) - (b.pickupOrder ?? 0))
    .map((s) => {
      const { absent, stages } = stageStatusForScholar(state, s);
      const next = absent ? null : stages.find((st) => !st.done);
      return { scholar: s, absent, complete: !absent && !next, next };
    });

  const groups = {};
  stops.forEach((stop) => {
    if (!stop.next || !SCHOOL_STAGES.has(stop.next.stage)) return;
    const key = `${stop.scholar.schoolId}|${stop.next.stage}`;
    if (!groups[key]) groups[key] = { schoolId: stop.scholar.schoolId, stage: stop.next.stage, scholars: [] };
    groups[key].scholars.push(stop.scholar);
  });
  const bulkGroups = Object.values(groups).filter((g) => g.scholars.length >= 2);

  function withNames(notifications) {
    return notifications.map((n) => ({
      ...n,
      guardianName: state.guardians.find((g) => g.id === n.guardianId)?.name ?? 'Guardian',
    }));
  }

  async function handleTap(scholar, stage) {
    const notifications = await logTripEvent(scholar.id, stage);
    setLastAction({
      heading: STAGE_ACTION_LABELS[stage],
      entries: [{ scholarName: scholar.name, notifications: withNames(notifications) }],
    });
  }

  async function handleAbsent(scholar) {
    const notifications = await logTripEvent(scholar.id, 'absent');
    setLastAction({
      heading: STAGE_ACTION_LABELS.absent,
      entries: [{ scholarName: scholar.name, notifications: withNames(notifications) }],
    });
  }

  async function handleBulkTap(group) {
    const results = await logBulkTripEvent(
      group.scholars.map((s) => s.id),
      group.stage
    );
    setLastAction({
      heading: `${STAGE_ACTION_LABELS[group.stage]} — ${group.scholars.length} scholars`,
      entries: results.map((r) => ({
        scholarName: group.scholars.find((s) => s.id === r.scholarId)?.name ?? 'Scholar',
        notifications: withNames(r.notifications),
      })),
    });
  }

  return (
    <div className="driver-screen">
      <header className="driver-topbar">
        <div>
          <p className="driver-greeting">Hi, {driver?.name?.split(' ')[0]}</p>
          <p className="driver-subgreeting">{stops.length} stops today</p>
        </div>
        <Link to="/driver/profile" className="avatar-btn">
          {initials(driver?.name || '?')}
        </Link>
      </header>

      {bulkGroups.length > 0 && (
        <div className="bulk-action-list">
          {bulkGroups.map((g) => (
            <Card key={`${g.schoolId}|${g.stage}`} className="bulk-action-card">
              <span>
                {STAGE_ACTION_LABELS[g.stage]} — {g.scholars.length} at {schoolName(state, g.schoolId)}
              </span>
              <button type="button" className="bulk-action-btn" onClick={() => handleBulkTap(g)}>
                Do all {g.scholars.length}
              </button>
            </Card>
          ))}
        </div>
      )}

      {stops.length === 0 ? (
        <EmptyState title="No scholars assigned" body="Ask the owner to assign scholars to you." />
      ) : (
        <div className="stop-list">
          {stops.map(({ scholar: s, absent, complete, next }) => (
            <Card key={s.id} className={`stop-card ${complete || absent ? 'stop-complete' : ''}`}>
              <div className="stop-top">
                <span className="stop-order">{s.pickupOrder}</span>
                <span className="stop-name">{s.name}</span>
                {absent && <span className="stop-absent-badge">Absent today</span>}
                {complete && !absent && <span className="stop-done-badge">✓ Done today</span>}
              </div>
              {!complete && !absent && (
                <>
                  <button type="button" className="stop-action-btn" onClick={() => handleTap(s, next.stage)}>
                    {STAGE_ACTION_LABELS[next.stage]}
                  </button>
                  <button type="button" className="stop-absent-btn" onClick={() => handleAbsent(s)}>
                    Scholar absent today
                  </button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {lastAction && (
        <div className="notify-toast">
          <p>
            <strong>{lastAction.heading}</strong>
          </p>
          {lastAction.entries.map((entry, i) => (
            <div key={i} className="toast-entry">
              <p className="toast-scholar-name">{entry.scholarName}</p>
              {entry.notifications.length > 0 && (
                <ul>
                  {entry.notifications.map((n) => (
                    <li key={n.guardianId}>
                      {n.sent
                        ? `Notified ${n.guardianName} (${n.channel === 'free_session' ? 'free session' : 'WhatsApp'})`
                        : `${n.guardianName}: ${n.reason}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setLastAction(null)}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}
