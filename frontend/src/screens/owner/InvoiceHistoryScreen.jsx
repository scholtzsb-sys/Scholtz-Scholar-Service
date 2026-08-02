import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Badge, EmptyState } from '../../components/ui/Primitives';
import { useApp } from '../../state/AppContext';
import { invoicesForBillingGuardian } from '../../lib/selectors';
import './owner.css';
import './invoicing.css';

export default function InvoiceHistoryScreen() {
  const { billingGuardianId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();

  const billing = state.guardians.find((g) => g.id === billingGuardianId);
  const invoices = invoicesForBillingGuardian(state, billingGuardianId);

  return (
    <Screen>
      <TopBar title={billing ? `${billing.name} — invoices` : 'Invoice history'} onBack={() => navigate(-1)} />

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Generate an invoice from one of this family's scholars." />
      ) : (
        <Card style={{ padding: 4 }}>
          {invoices.map((inv) => (
            <button key={inv.id} type="button" className="invoice-history-row" onClick={() => navigate(`/owner/invoices/${inv.id}`)}>
              <div>
                <strong>{inv.month}</strong>
                <div className="assignment-meta">{inv.invoiceNumber}</div>
              </div>
              <div className="invoice-history-right">
                <span>R{inv.total.toFixed(2)}</span>
                <Badge tone={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status === 'paid' ? 'Paid' : 'Unpaid'}</Badge>
              </div>
            </button>
          ))}
        </Card>
      )}
    </Screen>
  );
}
