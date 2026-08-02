import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, ConfirmBar, Badge } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { stageStatusForScholar } from '../../lib/selectors';
import { STAGE_LABELS } from '../../lib/mockData';
import './owner.css';

export default function DriverDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { deactivateDriver } = useAppActions();
  const [confirming, setConfirming] = useState(false);

  const driver = state.drivers.find((d) => d.id === id);
  if (!driver) {
    return (
      <Screen>
        <TopBar title="Driver not found" onBack={() => navigate('/owner/drivers')} />
      </Screen>
    );
  }

  const assigned = state.scholars
    .filter((s) => s.driverId === driver.id && s.active)
    .sort((a, b) => (a.pickupOrder ?? 0) - (b.pickupOrder ?? 0));

  return (
    <Screen>
      <TopBar title={driver.name} onBack={() => navigate('/owner/drivers')} />

      <Card>
        <span className="section-heading">Vehicle</span>
        <p style={{ margin: 0 }}>{driver.vehicleReg}</p>
        <span className="section-heading" style={{ marginTop: 10, display: 'block' }}>
          Phone
        </span>
        <p style={{ margin: 0 }}>{driver.phone}</p>
        {driver.linkedOwnerId && <Badge tone="neutral">Also an owner</Badge>}
      </Card>

      <div>
        <span className="section-heading">Today's stops ({assigned.length})</span>
        <div className="trip-stage-list">
          {assigned.map((s) => {
            const statuses = stageStatusForScholar(state, s);
            return (
              <Card key={s.id}>
                <strong>
                  #{s.pickupOrder} {s.name}
                </strong>
                <div className="trip-stage-list" style={{ marginTop: 8 }}>
                  {statuses.map((st) => (
                    <div key={st.stage} className="trip-stage-row" style={{ padding: '6px 0' }}>
                      <span>{STAGE_LABELS[st.stage]}</span>
                      {st.done ? (
                        <span className="stage-time">
                          {new Date(st.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="stage-pending">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
          {assigned.length === 0 && <Card>No scholars currently assigned.</Card>}
        </div>
      </div>

      <div className="form-row">
        <Button onClick={() => navigate(`/owner/drivers/${driver.id}/edit`)}>Edit driver</Button>
        {confirming ? (
          <ConfirmBar
            message={
              assigned.length > 0
                ? `${driver.name} still has ${assigned.length} scholar(s) assigned: ${assigned.map((s) => s.name).join(', ')}. Deactivating leaves them unassigned.`
                : `Deactivate ${driver.name}? Trip history stays intact and viewable.`
            }
            confirmLabel="Deactivate"
            danger
            onCancel={() => setConfirming(false)}
            onConfirm={async () => {
              await deactivateDriver(driver.id);
              navigate('/owner/drivers');
            }}
          />
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            Deactivate driver
          </Button>
        )}
      </div>
    </Screen>
  );
}
