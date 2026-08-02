import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Avatar, Badge, ConfirmBar } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { schoolName, driverName, withColor, guardiansForScholar, billingGuardianForScholar } from '../../lib/selectors';
import { TRANSPORT_PLANS } from '../../lib/mockData';
import './owner.css';

export default function ScholarDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { deactivateScholar } = useAppActions();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const scholar = state.scholars.find((s) => s.id === id);
  if (!scholar) {
    return (
      <Screen>
        <TopBar title="Scholar not found" onBack={() => navigate('/owner/scholars')} />
      </Screen>
    );
  }

  const withC = withColor(scholar);
  const guardians = guardiansForScholar(state, scholar);
  const billing = billingGuardianForScholar(state, scholar);

  return (
    <Screen>
      <TopBar title="Scholar" onBack={() => navigate('/owner/scholars')} />

      <Card>
        <div className="detail-header">
          <Avatar name={scholar.name} color={withC.color} />
          <div className="detail-title">
            <h1>{scholar.name}</h1>
            <span>
              Grade {scholar.grade || '—'} · {schoolName(state, scholar.schoolId)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="form-section">
        <div>
          <span className="section-heading">Home pickup address</span>
          <p style={{ margin: 0 }}>{scholar.homeAddress}</p>
        </div>
        <div>
          <span className="section-heading">Transport plan</span>
          <p style={{ margin: 0 }}>{TRANSPORT_PLANS[scholar.transportPlan]?.label}</p>
        </div>
        <div>
          <span className="section-heading">Driver</span>
          <p style={{ margin: 0 }}>
            {driverName(state, scholar.driverId)}
            {scholar.pickupOrder ? ` · stop #${scholar.pickupOrder}` : ''}
          </p>
        </div>
        <div>
          <span className="section-heading">Fee</span>
          <p style={{ margin: 0 }}>
            R{scholar.feePerMonth}/month{scholar.notifyAddon ? ' + R100/month WhatsApp notifications' : ''}
          </p>
        </div>
      </Card>

      <Card>
        <span className="section-heading">Parents &amp; guardians</span>
        <div className="form-section">
          {guardians.map((g) => (
            <div key={g.id} className="guardian-card-top" style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{g.name}</strong>
                <div className="assignment-meta">{g.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge tone={g.type === 'parent' ? 'success' : 'neutral'}>{g.type === 'parent' ? 'Parent' : 'Guardian'}</Badge>
                {g.isBillingContact && <Badge tone="warning">Billing</Badge>}
                <Badge tone={g.notify ? 'success' : 'neutral'}>{g.notify ? 'Notify on' : 'Notify off'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="form-row">
        <Button onClick={() => navigate(`/owner/scholars/${scholar.id}/edit`)}>Edit scholar</Button>
        <Button variant="secondary" onClick={() => navigate(`/owner/scholars/${scholar.id}/invoice`)}>
          Generate invoice
        </Button>
        {billing && (
          <Button variant="ghost" onClick={() => navigate(`/owner/families/${billing.id}/invoices`)}>
            View invoice history
          </Button>
        )}
        {confirmDeactivate ? (
          <ConfirmBar
            message={`Deactivate ${scholar.name}? Trip history and past invoices stay intact and viewable.`}
            confirmLabel="Deactivate"
            danger
            onCancel={() => setConfirmDeactivate(false)}
            onConfirm={() => {
              deactivateScholar(scholar.id);
              navigate('/owner/scholars');
            }}
          />
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>
            Deactivate scholar
          </Button>
        )}
      </div>
    </Screen>
  );
}
