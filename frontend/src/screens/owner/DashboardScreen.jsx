import { Link } from 'react-router-dom';
import { Screen, TopBar, Card, QuickActionGrid } from '../../components/ui/Primitives';
import { useApp } from '../../state/AppContext';
import { useCurrentOwner } from '../../state/hooks';
import { driverTodayProgress, scholarsUncollectedFromHomeToday } from '../../lib/selectors';
import './owner.css';

export default function DashboardScreen() {
  const { state } = useApp();
  const owner = useCurrentOwner();
  const uncollected = scholarsUncollectedFromHomeToday(state);
  const activeDrivers = state.drivers.filter((d) => d.active);

  return (
    <Screen>
      <TopBar title={`Hi, ${owner?.name?.split(' ')[0] ?? 'Owner'}`} avatarTo="/owner/profile" avatarLabel={owner?.name} />

      {uncollected.length > 0 && (
        <Card className="alert-banner">
          <strong>Not yet collected from home</strong>
          <ul>
            {uncollected.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <h2 className="section-heading">Today's progress</h2>
        <div className="driver-progress-list">
          {activeDrivers.map((d) => {
            const { done, total } = driverTodayProgress(state, d.id);
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <Link key={d.id} to={`/owner/drivers/${d.id}`} className="driver-progress-row">
                <div className="driver-progress-top">
                  <span>{d.name}</span>
                  <span className="driver-progress-count">
                    {done} of {total}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
          {activeDrivers.length === 0 && <Card>No active drivers yet.</Card>}
        </div>
      </section>

      <section>
        <h2 className="section-heading">Quick actions</h2>
        <QuickActionGrid
          actions={[
            { to: '/owner/scholars', label: 'Scholars', icon: '🎒' },
            { to: '/owner/drivers', label: 'Drivers', icon: '🚐' },
            { to: '/owner/scholars/new', label: 'Register a new scholar', icon: '➕' },
            { to: '/owner/drivers/new', label: 'Register a new driver', icon: '🧑‍✈️' },
          ]}
        />
      </section>
    </Screen>
  );
}
