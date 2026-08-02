import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentOwner } from '../../state/hooks';
import './owner.css';

export default function OwnerProfileScreen() {
  const { state } = useApp();
  const { logOut, switchRole } = useAppActions();
  const owner = useCurrentOwner();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  function handleLogOut() {
    logOut();
    navigate('/', { replace: true });
  }

  async function handleSwitchToDriver() {
    setSwitching(true);
    setError('');
    try {
      await switchRole('driver');
      navigate('/driver', { replace: true });
    } catch (err) {
      setError(err.message);
      setSwitching(false);
    }
  }

  if (!owner) return null;

  const canSwitchToDriver = state.session?.availableRoles?.includes('driver');

  return (
    <Screen>
      <TopBar title="Profile" onBack={() => navigate('/owner')} />

      <Card>
        <span className="section-heading">You</span>
        <p style={{ margin: 0, fontWeight: 600 }}>{owner.name}</p>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{owner.phone}</p>
      </Card>

      <div className="list-header-row">
        <span className="section-heading" style={{ margin: 0 }}>
          Owners ({state.owners.length})
        </span>
        <Button size="sm" onClick={() => navigate('/owner/profile/add-owner')}>
          + Add owner
        </Button>
      </div>

      <Card style={{ padding: 4 }}>
        {state.owners.map((o) => (
          <div key={o.id} className="scholar-row" style={{ padding: '12px' }}>
            <div className="scholar-row-info">
              <span className="scholar-row-name">{o.name}</span>
              <span className="scholar-row-meta">{o.phone}</span>
            </div>
          </div>
        ))}
      </Card>

      {canSwitchToDriver && (
        <>
          {error && <EmptyState title={error} />}
          <Button variant="secondary" onClick={handleSwitchToDriver} disabled={switching}>
            {switching ? 'Switching…' : 'Switch to Driver view'}
          </Button>
        </>
      )}

      <Button variant="danger" onClick={handleLogOut}>
        Log out
      </Button>
    </Screen>
  );
}
