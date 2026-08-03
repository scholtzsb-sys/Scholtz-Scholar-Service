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
  const [paymentType, setPaymentType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null); // { payment, invoice } once recorded

  useEffect(() => {
    api
      .getInvoice(invoiceId)
      .then(setInvoice)
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

  const amount = paymentType === 'full' ? balance : Number(partialAmount) || 0;
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
        <label className="toggle-row" style={{ cursor: 'pointer' }}>
          <input type="radio" name="paymentType" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} />
          <span style={{ flex: 1, textAlign: 'left' }}>Paid in full (R{balance.toFixed(2)})</span>
        </label>
        <label className="toggle-row" style={{ cursor: 'pointer' }}>
          <input type="radio" name="paymentType" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} />
          <span style={{ flex: 1, textAlign: 'left' }}>Partial payment</span>
        </label>
        {paymentType === 'partial' && (
          <Field label="Amount paid (R)" hint={`Balance due is R${balance.toFixed(2)}`}>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              placeholder="e.g. 500"
              autoFocus
            />
          </Field>
        )}
      </Card>

      {error && <EmptyState title={error} />}
      <Button size="lg" full onClick={handleGenerateReceipt} disabled={!canSubmit}>
        {submitting ? 'Recording…' : 'Generate receipt'}
      </Button>
    </Screen>
  );
}
