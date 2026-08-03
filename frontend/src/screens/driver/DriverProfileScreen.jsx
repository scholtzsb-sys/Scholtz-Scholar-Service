import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentDriver } from '../../state/hooks';
import { schoolName } from '../../lib/selectors';
import '../owner/owner.css';
import './driver.css';

export default function DriverProfileScreen() {
  const { state } = useApp();
  const { logOut, switchRole } = useAppActions();
  const driver = useCurrentDriver();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  const assignedScholars = state.scholars
    .filter((s) => s.driverId === driver?.id && s.active)
    .sort((a, b) => (a.pickupOrder ?? 0) - (b.pickupOrder ?? 0));

  function handleLogOut() {
    logOut();
    navigate('/', { replace: true });
  }

  async function handleSwitchToOwner() {
    setSwitching(true);
    setError('');
    try {
      await switchRole('owner');
      navigate('/owner', { replace: true });
    } catch (err) {
      setError(err.message);
      setSwitching(false);
    }
  }

  if (!driver) return null;

  const canSwitchToOwner = state.session?.availableRoles?.includes('owner');

  return (
    <Screen maxWidth={480}>
      <TopBar title="Profile" onBack={() => navigate('/driver')} />
      <Card className="form-section">
        <div>
          <span className="section-heading">Name</span>
          <p style={{ margin: 0 }}>{driver.name}</p>
        </div>
        <div>
          <span className="section-heading">Phone</span>
          <p style={{ margin: 0 }}>{driver.phone}</p>
        </div>
        <div>
          <span className="section-heading">Vehicle registration</span>
          <p style={{ margin: 0 }}>{driver.vehicleReg}</p>
        </div>
      </Card>

      <div>
        <span className="section-heading">Today's assigned scholars ({assignedScholars.length})</span>
        {assignedScholars.length === 0 ? (
          <Card style={{ marginTop: 8 }}>No scholars currently assigned.</Card>
        ) : (
          <Card style={{ padding: 4, marginTop: 8 }}>
            {assignedScholars.map((s) => (
              <div key={s.id} className="scholar-row" style={{ padding: '12px' }}>
                <div className="scholar-row-info">
                  <span className="scholar-row-name">
                    #{s.pickupOrder} {s.name}
                  </span>
                  <span className="scholar-row-meta">{schoolName(state, s.schoolId)}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {canSwitchToOwner && (
        <>
          {error && <EmptyState title={error} />}
          <Button variant="secondary" onClick={handleSwitchToOwner} disabled={switching}>
            {switching ? 'Switching…' : 'Switch to Owner view'}
          </Button>
        </>
      )}

      <Button variant="danger" onClick={handleLogOut}>
        Log out
      </Button>
    </Screen>
  );
}
