import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Screen, Button, Card, EmptyState } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';

export default function ContinueAsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAppActions();
  const { phone, password, roles } = location.state || {};
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState(null);

  useEffect(() => {
    if (!phone || !password || !roles) navigate('/', { replace: true });
  }, [phone, password, roles, navigate]);

  if (!phone || !password || !roles) return null;

  async function choose(role) {
    setChoosing(role.role);
    setError('');
    try {
      const result = await login(phone, password, role.role);
      navigate(result.session.role === 'owner' ? '/owner' : '/driver', { replace: true });
    } catch (err) {
      setError(err.message);
      setChoosing(null);
    }
  }

  return (
    <Screen maxWidth={420}>
      <div className="continue-as-header">
        <h1>Continue as…</h1>
        <p>This number is linked to more than one role.</p>
      </div>
      {error && <EmptyState title={error} />}
      <div className="continue-as-list">
        {roles.map((r) => (
          <Card key={r.role} className="continue-as-card" onClick={() => choose(r)}>
            <span className="continue-as-role">{r.role === 'owner' ? 'Owner' : 'Driver'}</span>
            <span>{r.label.split('— ')[1]}</span>
            <Button size="sm" disabled={choosing === r.role}>
              {choosing === r.role ? 'Continuing…' : 'Continue'}
            </Button>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
