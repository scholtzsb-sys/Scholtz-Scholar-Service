import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, EmptyState, Badge } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { billingGuardianForScholar, schoolName } from '../../lib/selectors';
import './owner.css';
import './invoicing.css';

export default function GenerateInvoiceScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { generateInvoice } = useAppActions();

  const scholar = state.scholars.find((s) => s.id === id);
  const billing = scholar ? billingGuardianForScholar(state, scholar) : null;

  const familyScholars = useMemo(() => {
    if (!billing) return [];
    return state.scholars.filter((s) => s.active && billingGuardianForScholar(state, s)?.id === billing.id);
  }, [state, billing]);

  const [fees, setFees] = useState(() => Object.fromEntries(familyScholars.map((s) => [s.id, s.feePerMonth])));
  const [sentInvoiceId, setSentInvoiceId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!scholar) {
    return (
      <Screen>
        <TopBar title="Scholar not found" onBack={() => navigate('/owner/scholars')} />
      </Screen>
    );
  }

  if (!billing) {
    return (
      <Screen>
        <TopBar title="Generate invoice" onBack={() => navigate(`/owner/scholars/${scholar.id}`)} />
        <EmptyState
          title="No billing parent set"
          body={`${scholar.name} doesn't have a parent marked "Bill invoices to this parent" yet.`}
          action={<Button onClick={() => navigate(`/owner/scholars/${scholar.id}/edit`)}>Edit scholar</Button>}
        />
      </Screen>
    );
  }

  const subtotal = familyScholars.reduce((sum, s) => sum + Number(fees[s.id] || 0) + (s.notifyAddon ? 100 : 0), 0);

  async function handleGenerate() {
    setSubmitting(true);
    setError('');
    try {
      const lineItems = familyScholars.map((s) => ({ scholarId: s.id, amount: Number(fees[s.id] || 0) }));
      const { invoice } = await generateInvoice({ billingGuardianId: billing.id, lineItems });
      setSentInvoiceId(invoice.id);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (sentInvoiceId) {
    return (
      <Screen>
        <TopBar title="Invoice sent" onBack={() => navigate(`/owner/scholars/${scholar.id}`)} />
        <Card>
          <p>
            Invoice sent to <strong>{billing.name}</strong> via{' '}
            <strong>{billing.billingChannel === 'email' ? billing.email : 'WhatsApp'}</strong>.
          </p>
        </Card>
        <div className="form-row">
          <Button onClick={() => navigate(`/owner/invoices/${sentInvoiceId}`)}>View invoice</Button>
          <Button variant="secondary" onClick={() => navigate(`/owner/scholars/${scholar.id}`)}>
            Back to scholar
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Generate invoice" onBack={() => navigate(`/owner/scholars/${scholar.id}`)} />

      <Card>
        <span className="section-heading">Billed to</span>
        <p style={{ margin: 0, fontWeight: 600 }}>{billing.name}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Delivered via {billing.billingChannel === 'email' ? `email (${billing.email})` : 'WhatsApp'}
        </p>
      </Card>

      <div className="form-section">
        {familyScholars.map((s) => (
          <Card key={s.id} className="invoice-line-editor">
            <div className="guardian-card-top">
              <strong>{s.name}</strong>
              {s.notifyAddon && <Badge tone="warning">+ WhatsApp R100</Badge>}
            </div>
            <span className="assignment-meta">
              {schoolName(state, s.schoolId)} · {s.transportPlan === 'full' ? 'Drop-off & pick-up' : s.transportPlan === 'morning' ? 'School drop-off only' : 'Home pick-up only'}
            </span>
            <label className="invoice-fee-input">
              R
              <input
                type="number"
                min="0"
                value={fees[s.id]}
                onChange={(e) => setFees((f) => ({ ...f, [s.id]: e.target.value }))}
              />
            </label>
          </Card>
        ))}
      </div>

      <Card className="invoice-total-card">
        <span>Total</span>
        <strong>R{subtotal.toFixed(2)}</strong>
      </Card>

      {error && <EmptyState title={error} />}
      <Button size="lg" full onClick={handleGenerate} disabled={submitting}>
        {submitting ? 'Generating…' : 'Generate & send invoice'}
      </Button>
    </Screen>
  );
}
