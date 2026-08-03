import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Field, TextInput, EmptyState } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';
import { api } from '../../lib/api';
import { balanceDue } from '../../lib/invoiceFormat';
import ReceiptPreview from '../../components/ReceiptPreview';
import './owner.css';
import './invoicing.css';

export default function RecordPaymentScreen() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { recordPayment } = useAppActions();

  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null); // { payment, invoice } once recorded

  useEffect(() => {
    api
      .getInvoice(invoiceId)
      .then((inv) => {
        setInvoice(inv);
        // Pre-filled with the full balance — the owner edits it down for a
        // partial payment rather than toggling between two modes first.
        setAmountInput(balanceDue(inv).toFixed(2));
      })
      .catch((err) => setError(err.message));
  }, [invoiceId]);

  if (error) {
    return (
      <Screen>
        <TopBar title="Record payment" onBack={() => navigate(-1)} />
        <EmptyState title={error} />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen>
        <TopBar title="Record payment" onBack={() => navigate(-1)} />
        <EmptyState title="Loading…" />
      </Screen>
    );
  }

  const billing = invoice.billingGuardian;
  const balance = balanceDue(invoice);

  if (receipt) {
    return (
      <Screen>
        <TopBar title="Receipt" onBack={() => navigate(`/owner/invoices/${invoiceId}`)} />
        <ReceiptPreview invoice={receipt.invoice} billing={receipt.invoice.billingGuardian ?? billing} payment={receipt.payment} />
        <Button size="lg" full onClick={() => navigate(`/owner/invoices/${invoiceId}`)}>
          Done
        </Button>
      </Screen>
    );
  }

  const amount = Number(amountInput) || 0;
  const canSubmit = amount > 0 && !submitting;

  async function handleGenerateReceipt() {
    setSubmitting(true);
    setError('');
    try {
      const result = await recordPayment(invoice.id, amount);
      setReceipt(result);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Record payment" onBack={() => navigate(-1)} />

      <Card className="form-section">
        <span className="section-heading">{invoice.invoiceNumber}</span>
        <p style={{ margin: 0 }}>Billed to {billing?.name}</p>
        <div className="invoice-history-row" style={{ padding: 0, cursor: 'default' }}>
          <span>Invoice total</span>
          <span>R{invoice.total.toFixed(2)}</span>
        </div>
        <div className="invoice-history-row" style={{ padding: 0, cursor: 'default' }}>
          <span>Paid to date</span>
          <span>R{invoice.amountPaid.toFixed(2)}</span>
        </div>
        <div className="invoice-history-row" style={{ padding: 0, cursor: 'default', fontWeight: 700 }}>
          <span>Balance due</span>
          <span>R{balance.toFixed(2)}</span>
        </div>
      </Card>

      <Card className="form-section">
        <Field label="Amount paid (R)" hint={`Balance due is R${balance.toFixed(2)} — edit this for a partial payment`}>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="e.g. 500"
            autoFocus
          />
        </Field>
      </Card>

      {error && <EmptyState title={error} />}
      <Button size="lg" full onClick={handleGenerateReceipt} disabled={!canSubmit}>
        {submitting ? 'Recording…' : 'Generate receipt'}
      </Button>
    </Screen>
  );
}
