import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentDriver } from '../../state/hooks';
import { stageStatusForScholar } from '../../lib/selectors';
import { STAGE_ACTION_LABELS } from '../../lib/mockData';
import { initials } from '../../lib/palette';
import './driver.css';

export default function TripScreen() {
  const { state } = useApp();
  const { logTripEvent } = useAppActions();
  const driver = useCurrentDriver();
  const [lastAction, setLastAction] = useState(null);

  const stops = state.scholars
    .filter((s) => s.driverId === driver?.id && s.active)
    .sort((a, b) => (a.pickupOrder ?? 0) - (b.pickupOrder ?? 0));

  async function handleTap(scholar, stage) {
    const notifications = await logTripEvent(scholar.id, stage);
    const withNames = notifications.map((n) => ({
      ...n,
      guardianName: state.guardians.find((g) => g.id === n.guardianId)?.name ?? 'Guardian',
    }));
    setLastAction({ scholarName: scholar.name, stage, notifications: withNames });
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

      {stops.length === 0 ? (
        <EmptyState title="No scholars assigned" body="Ask the owner to assign scholars to you." />
      ) : (
        <div className="stop-list">
          {stops.map((s) => {
            const statuses = stageStatusForScholar(state, s);
            const next = statuses.find((st) => !st.done);
            const complete = !next;
            return (
              <Card key={s.id} className={`stop-card ${complete ? 'stop-complete' : ''}`}>
                <div className="stop-top">
                  <span className="stop-order">{s.pickupOrder}</span>
                  <span className="stop-name">{s.name}</span>
                  {complete && <span className="stop-done-badge">✓ Done today</span>}
                </div>
                {!complete && (
                  <button type="button" className="stop-action-btn" onClick={() => handleTap(s, next.stage)}>
                    {STAGE_ACTION_LABELS[next.stage]}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {lastAction && (
        <div className="notify-toast">
          <p>
            <strong>{lastAction.scholarName}</strong> — {STAGE_ACTION_LABELS[lastAction.stage]}
          </p>
          <ul>
            {lastAction.notifications.map((n) => (
              <li key={n.guardianId}>
                {n.sent ? `Notified ${n.guardianName} (${n.channel === 'free_session' ? 'free session' : 'WhatsApp'})` : `${n.guardianName}: ${n.reason}`}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setLastAction(null)}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}
