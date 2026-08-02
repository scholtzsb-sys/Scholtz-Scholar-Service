import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Badge, EmptyState } from '../../components/ui/Primitives';
import { useApp } from '../../state/AppContext';
import { api } from '../../lib/api';
import './owner.css';
import './invoicing.css';

export default function InvoiceHistoryScreen() {
  const { billingGuardianId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [invoices, setInvoices] = useState(null); // null while loading
  const [error, setError] = useState('');

  const billing = state.guardians.find((g) => g.id === billingGuardianId);

  useEffect(() => {
    api
      .listFamilyInvoices(billingGuardianId)
      .then(setInvoices)
      .catch((err) => setError(err.message));
  }, [billingGuardianId]);

  return (
    <Screen>
      <TopBar title={billing ? `${billing.name} — invoices` : 'Invoice history'} onBack={() => navigate(-1)} />

      {error && <EmptyState title={error} />}
      {!error && invoices === null && <EmptyState title="Loading…" />}
      {invoices?.length === 0 && (
        <EmptyState title="No invoices yet" body="Generate an invoice from one of this family's scholars." />
      )}
      {invoices?.length > 0 && (
        <Card style={{ padding: 4 }}>
          {invoices.map((inv) => (
            <button key={inv.id} type="button" className="invoice-history-row" onClick={() => navigate(`/owner/invoices/${inv.id}`)}>
              <div>
                <strong>{inv.month}</strong>
                <div className="assignment-meta">{inv.invoiceNumber}</div>
              </div>
              <div className="invoice-history-right">
                <span>R{inv.total.toFixed(2)}</span>
                <Badge tone={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status === 'PAID' ? 'Paid' : 'Unpaid'}</Badge>
              </div>
            </button>
          ))}
        </Card>
      )}
    </Screen>
  );
}
