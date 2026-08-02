import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentOwner } from '../../state/hooks';
import './owner.css';

export default function OwnerProfileScreen() {
  const { state } = useApp();
  const { logOut } = useAppActions();
  const owner = useCurrentOwner();
  const navigate = useNavigate();

  function handleLogOut() {
    logOut();
    navigate('/', { replace: true });
  }

  if (!owner) return null;

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

      <Button variant="danger" onClick={handleLogOut}>
        Log out
      </Button>
    </Screen>
  );
}
