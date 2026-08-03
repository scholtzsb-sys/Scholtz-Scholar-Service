import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Badge, EmptyState } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';
import { api } from '../../lib/api';
import { formatPeriod, invoiceStatusMeta, balanceDue } from '../../lib/invoiceFormat';
import InvoicePdfPreview from '../../components/InvoicePdfPreview';
import './owner.css';
import './invoicing.css';

export default function InvoiceDetailScreen() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { attachProofOfPayment } = useAppActions();
  const [showPdf, setShowPdf] = useState(false);
  const [invoice, setInvoice] = useState(null); // null while loading
  const [error, setError] = useState('');

  function refetch() {
    return api
      .getInvoice(invoiceId)
      .then(setInvoice)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  if (error) {
    return (
      <Screen>
        <TopBar title="Invoice" onBack={() => navigate(-1)} />
        <EmptyState title={error} />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen>
        <TopBar title="Invoice" onBack={() => navigate(-1)} />
        <EmptyState title="Loading…" />
      </Screen>
    );
  }

  const billing = invoice.billingGuardian;
  const statusMeta = invoiceStatusMeta(invoice.status);
  const balance = balanceDue(invoice);

  async function handleProofChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await attachProofOfPayment(invoice.id, file.name);
    refetch();
  }

  return (
    <Screen>
      <TopBar title={invoice.invoiceNumber} onBack={() => navigate(-1)} />

      <Card>
        <div className="guardian-card-top">
          <strong>{formatPeriod(invoice.periodStart, invoice.periodEnd)}</strong>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>
        <p className="assignment-meta">Billed to {billing?.name}</p>
      </Card>

      <Card className="form-section">
        <span className="section-heading">Scholars &amp; amounts</span>
        {invoice.lineItems.map((li) => (
          <div key={li.id} className="invoice-history-row" style={{ padding: 0, cursor: 'default' }}>
            <span>{li.scholarName}</span>
            <span>
              R{li.amount.toFixed(2)}
              {li.notifyAddon ? ` + R${li.addonAmount.toFixed(2)}` : ''}
            </span>
          </div>
        ))}
        <div className="invoice-history-row" style={{ padding: 0, cursor: 'default', fontWeight: 700 }}>
          <span>Total</span>
          <span>R{invoice.total.toFixed(2)}</span>
        </div>
      </Card>

      <Button variant="secondary" onClick={() => setShowPdf((v) => !v)}>
        {showPdf ? 'Hide invoice PDF' : 'View invoice PDF'}
      </Button>

      {showPdf && <InvoicePdfPreview invoice={invoice} billing={billing} />}

      <Card className="form-section">
        <span className="section-heading">Proof of payment</span>
        {invoice.proofOfPaymentFilename ? (
          <p style={{ margin: 0 }}>📎 {invoice.proofOfPaymentFilename}</p>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>None attached yet.</p>
        )}
        <label className="link-btn" style={{ cursor: 'pointer' }}>
          {invoice.proofOfPaymentFilename ? 'Replace attachment' : 'Attach a screenshot'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProofChange} />
        </label>
      </Card>

      <Card className="form-section">
        <span className="section-heading">Payment</span>
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

        {invoice.payments?.length > 0 && (
          <div>
            <span className="section-heading" style={{ display: 'block', marginTop: 8 }}>
              Payment history
            </span>
            {invoice.payments.map((p) => (
              <div key={p.id} className="invoice-history-row" style={{ padding: '4px 0', cursor: 'default' }}>
                <span>{new Date(p.paidAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>R{p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {invoice.status === 'PAID' ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            A "payment received" WhatsApp confirmation was sent to {billing?.name}.
          </p>
        ) : (
          <Button onClick={() => navigate(`/owner/invoices/${invoice.id}/payment`)}>Record payment</Button>
        )}
      </Card>
    </Screen>
  );
}
