import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentDriver } from '../../state/hooks';
import './driver.css';

export default function DriverProfileScreen() {
  const { state } = useApp();
  const { logOut, switchRole } = useAppActions();
  const driver = useCurrentDriver();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  const assignedToday = state.scholars.filter((s) => s.driverId === driver?.id && s.active).length;

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
        <div>
          <span className="section-heading">Today's assigned scholars</span>
          <p style={{ margin: 0 }}>{assignedToday}</p>
        </div>
      </Card>

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
