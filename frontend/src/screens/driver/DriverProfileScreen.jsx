import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentDriver } from '../../state/hooks';
import './driver.css';

export default function DriverProfileScreen() {
  const { state } = useApp();
  const { logOut } = useAppActions();
  const driver = useCurrentDriver();
  const navigate = useNavigate();

  const assignedToday = state.scholars.filter((s) => s.driverId === driver?.id && s.active).length;

  function handleLogOut() {
    logOut();
    navigate('/', { replace: true });
  }

  if (!driver) return null;

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
      <Button variant="danger" onClick={handleLogOut}>
        Log out
      </Button>
    </Screen>
  );
}
