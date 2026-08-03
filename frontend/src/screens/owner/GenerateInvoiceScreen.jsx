import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Field, TextInput, EmptyState, Badge } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { billingGuardianForScholar, schoolName } from '../../lib/selectors';
import { currentMonthRange } from '../../lib/invoiceFormat';
import InvoicePdfPreview from '../../components/InvoicePdfPreview';
import './owner.css';
import './invoicing.css';

const PLAN_DISPLAY_LABELS = {
  full: 'Drop-off & pick-up',
  morning: 'School drop-off only',
  afternoon: 'Home pick-up only',
};

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

  const defaultRange = useMemo(() => currentMonthRange(), []);
  const [periodStart, setPeriodStart] = useState(defaultRange.start);
  const [periodEnd, setPeriodEnd] = useState(defaultRange.end);
  const [fees, setFees] = useState(() => Object.fromEntries(familyScholars.map((s) => [s.id, s.feePerMonth])));
  const [draft, setDraft] = useState(null); // built locally by "Generate" — nothing saved until "Send"
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
  const periodValid = periodStart && periodEnd && periodEnd >= periodStart;

  function handleGeneratePreview() {
    if (!periodValid) {
      setError('Choose a valid date range — the "to" date must be on or after the "from" date.');
      return;
    }
    setError('');
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const lineItems = familyScholars.map((s) => ({
      scholarId: s.id,
      scholarName: s.name,
      school: schoolName(state, s.schoolId),
      transportPlan: PLAN_DISPLAY_LABELS[s.transportPlan] ?? '',
      amount: Number(fees[s.id] || 0),
      notifyAddon: s.notifyAddon,
      addonAmount: s.notifyAddon ? 100 : 0,
    }));

    setDraft({
      invoiceNumber: null,
      periodStart,
      periodEnd,
      issuedDate,
      dueDate,
      lineItems,
      subtotal,
      total: subtotal,
    });
  }

  async function handleSend() {
    setSubmitting(true);
    setError('');
    try {
      const lineItems = familyScholars.map((s) => ({ scholarId: s.id, amount: Number(fees[s.id] || 0) }));
      const { invoice } = await generateInvoice({ billingGuardianId: billing.id, periodStart, periodEnd, lineItems });
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

  if (draft) {
    return (
      <Screen>
        <TopBar title="Preview invoice" onBack={() => setDraft(null)} />
        <InvoicePdfPreview invoice={draft} billing={billing} />
        {error && <EmptyState title={error} />}
        <div className="form-row">
          <Button size="lg" full onClick={handleSend} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invoice'}
          </Button>
          <Button variant="secondary" full onClick={() => setDraft(null)} disabled={submitting}>
            Back — amend details
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

      <Card className="form-row">
        <Field label="Period from">
          <TextInput type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
        </Field>
        <Field label="Period to">
          <TextInput type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
        </Field>
      </Card>

      <div className="form-section">
        {familyScholars.map((s) => (
          <Card key={s.id} className="invoice-line-editor">
            <div className="guardian-card-top">
              <strong>{s.name}</strong>
              {s.notifyAddon && <Badge tone="warning">+ WhatsApp R100</Badge>}
            </div>
            <span className="assignment-meta">
              {schoolName(state, s.schoolId)} · {PLAN_DISPLAY_LABELS[s.transportPlan]}
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
      <Button size="lg" full onClick={handleGeneratePreview}>
        Generate invoice
      </Button>
    </Screen>
  );
}
