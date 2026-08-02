import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Avatar, CollapsibleSection, EmptyState, ConfirmBar } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { useCurrentOwner } from '../../state/hooks';
import { schoolName, driverName, withColor } from '../../lib/selectors';
import './owner.css';

export default function ScholarsListScreen() {
  const { state } = useApp();
  const { reactivateScholar, deleteScholar } = useAppActions();
  const owner = useCurrentOwner();
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const active = state.scholars.filter((s) => s.active);
  const deactivated = state.scholars.filter((s) => !s.active);

  return (
    <Screen>
      <TopBar title="Scholars" onBack={() => navigate('/owner')} avatarTo="/owner/profile" avatarLabel={owner?.name} />

      <div className="list-header-row">
        <span className="section-heading" style={{ margin: 0 }}>
          {active.length} active
        </span>
        <Button size="sm" onClick={() => navigate('/owner/scholars/new')}>
          + Register a new scholar
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyState title="No scholars yet" body="Register your first scholar to get started." />
      ) : (
        <Card style={{ padding: 4 }}>
          {active.map((s) => {
            const withC = withColor(s);
            return (
              <Link key={s.id} to={`/owner/scholars/${s.id}`} className="scholar-row">
                <Avatar name={s.name} color={withC.color} />
                <div className="scholar-row-info">
                  <span className="scholar-row-name">{s.name}</span>
                  <span className="scholar-row-meta">
                    {schoolName(state, s.schoolId)} · {driverName(state, s.driverId)}
                  </span>
                </div>
              </Link>
            );
          })}
        </Card>
      )}

      <CollapsibleSection title="Deactivated" count={deactivated.length}>
        {deactivated.length === 0 ? (
          <EmptyState title="No deactivated scholars" />
        ) : (
          deactivated.map((s) => (
            <div key={s.id} className="deactivated-row">
              <span>
                {s.name} · deactivated {new Date(s.deactivatedAt).toLocaleDateString('en-ZA')}
              </span>
              {confirmDeleteId === s.id ? (
                <ConfirmBar
                  message={`Delete ${s.name} permanently? Trip history and past invoices will be lost.`}
                  confirmLabel="Delete"
                  danger
                  onCancel={() => setConfirmDeleteId(null)}
                  onConfirm={() => {
                    deleteScholar(s.id);
                    setConfirmDeleteId(null);
                  }}
                />
              ) : (
                <div className="deactivated-row-actions">
                  <button type="button" className="action-reactivate" onClick={() => reactivateScholar(s.id)}>
                    Reactivate
                  </button>
                  <button type="button" className="action-delete" onClick={() => setConfirmDeleteId(s.id)}>
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
