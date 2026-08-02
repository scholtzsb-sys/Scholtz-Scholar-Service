import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, CollapsibleSection, EmptyState, ConfirmBar, Badge } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentOwner } from '../../state/hooks';
import './owner.css';

export default function DriversListScreen() {
  const { state } = useApp();
  const { reactivateDriver, deleteDriver } = useAppActions();
  const owner = useCurrentOwner();
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const active = state.drivers.filter((d) => d.active);
  const deactivated = state.drivers.filter((d) => !d.active);

  function assignedScholarsFor(driverId) {
    return state.scholars.filter((s) => s.active && s.driverId === driverId);
  }

  return (
    <Screen>
      <TopBar title="Drivers" onBack={() => navigate('/owner')} avatarTo="/owner/profile" avatarLabel={owner?.name} />

      <div className="list-header-row">
        <span className="section-heading" style={{ margin: 0 }}>
          {active.length} active
        </span>
        <Button size="sm" onClick={() => navigate('/owner/drivers/new')}>
          + Register a new driver
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyState title="No drivers yet" body="Register your first driver to get started." />
      ) : (
        <Card style={{ padding: 4 }}>
          {active.map((d) => (
            <Link key={d.id} to={`/owner/drivers/${d.id}`} className="driver-row">
              <div className="driver-row-info">
                <span className="driver-row-name">{d.name}</span>
                <span className="driver-row-meta">
                  {d.vehicleReg} · {assignedScholarsFor(d.id).length} scholars assigned
                </span>
              </div>
              {d.linkedOwnerId && <Badge tone="neutral">Also owner</Badge>}
            </Link>
          ))}
        </Card>
      )}

      <CollapsibleSection title="Deactivated" count={deactivated.length}>
        {deactivated.length === 0 ? (
          <EmptyState title="No deactivated drivers" />
        ) : (
          deactivated.map((d) => (
            <div key={d.id} className="deactivated-row">
              <span>
                {d.name} · deactivated {new Date(d.deactivatedAt).toLocaleDateString('en-ZA')}
              </span>
              {confirmDeleteId === d.id ? (
                <ConfirmBar
                  message={`Delete ${d.name} permanently? Trip history and past invoices for their scholars stay intact; this only removes the driver record.`}
                  confirmLabel="Delete"
                  danger
                  onCancel={() => setConfirmDeleteId(null)}
                  onConfirm={() => {
                    deleteDriver(d.id);
                    setConfirmDeleteId(null);
                  }}
                />
              ) : (
                <div className="deactivated-row-actions">
                  <button type="button" className="action-reactivate" onClick={() => reactivateDriver(d.id)}>
                    Reactivate
                  </button>
                  <button type="button" className="action-delete" onClick={() => setConfirmDeleteId(d.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </CollapsibleSection>
    </Screen>
  );
}
