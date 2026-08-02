import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Badge, Toggle } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import InvoicePdfPreview from '../../components/InvoicePdfPreview';
import './owner.css';
import './invoicing.css';

export default function InvoiceDetailScreen() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { markInvoicePaid, attachProofOfPayment } = useAppActions();
  const [showPdf, setShowPdf] = useState(false);

  const invoice = state.invoices.find((i) => i.id === invoiceId);
  const billing = invoice ? state.guardians.find((g) => g.id === invoice.billingGuardianId) : null;

  if (!invoice) {
    return (
      <Screen>
        <TopBar title="Invoice not found" onBack={() => navigate('/owner/scholars')} />
      </Screen>
    );
  }

  function handleProofChange(e) {
    const file = e.target.files?.[0];
    if (file) attachProofOfPayment(invoice.id, { filename: file.name });
  }

  return (
    <Screen>
      <TopBar title={invoice.invoiceNumber} onBack={() => navigate(-1)} />

      <Card>
        <div className="guardian-card-top">
          <strong>{invoice.month}</strong>
          <Badge tone={invoice.status === 'paid' ? 'success' : 'warning'}>{invoice.status === 'paid' ? 'Paid' : 'Unpaid'}</Badge>
        </div>
        <p className="assignment-meta">Billed to {billing?.name}</p>
      </Card>

      <Card className="form-section">
        <span className="section-heading">Scholars &amp; amounts</span>
        {invoice.lineItems.map((li) => (
          <div key={li.scholarId} className="invoice-history-row" style={{ padding: 0, cursor: 'default' }}>
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
        {invoice.proofOfPayment ? (
          <p style={{ margin: 0 }}>📎 {invoice.proofOfPayment.filename}</p>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>None attached yet.</p>
        )}
        <label className="link-btn" style={{ cursor: 'pointer' }}>
          {invoice.proofOfPayment ? 'Replace attachment' : 'Attach a screenshot'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProofChange} />
        </label>
      </Card>

      <Card>
        <Toggle
          checked={invoice.status === 'paid'}
          onChange={(v) => markInvoicePaid(invoice.id, v)}
          label="Mark as paid"
        />
        {invoice.status === 'paid' && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Marking paid sent a "payment received" WhatsApp confirmation to {billing?.name}.
          </p>
        )}
      </Card>
    </Screen>
  );
}
