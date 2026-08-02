import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Screen, Button, Card } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';

export default function ContinueAsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { startSession } = useAppActions();
  const { phone, roles } = location.state || {};

  useEffect(() => {
    if (!phone || !roles) navigate('/', { replace: true });
  }, [phone, roles, navigate]);

  if (!phone || !roles) return null;

  function choose(role) {
    startSession({ ...role, phone });
    navigate(role.role === 'owner' ? '/owner' : '/driver', { replace: true });
  }

  return (
    <Screen maxWidth={420}>
      <div className="continue-as-header">
        <h1>Continue as…</h1>
        <p>This number is linked to more than one role.</p>
      </div>
      <div className="continue-as-list">
        {roles.map((r) => (
          <Card key={r.role} className="continue-as-card" onClick={() => choose(r)}>
            <span className="continue-as-role">{r.role === 'owner' ? 'Owner' : 'Driver'}</span>
            <span>{r.label.split('— ')[1]}</span>
            <Button size="sm">Continue</Button>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
