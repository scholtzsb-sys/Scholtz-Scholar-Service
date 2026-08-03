import logo from '../assets/logo.png';
import { formatPeriod } from '../lib/invoiceFormat';
import './invoicePdfPreview.css';

// Mirrors the real brand identity (navy/yellow/sky-blue) used on the actual
// invoice PDF sent to families — intentionally not the app's teal UI palette.
// Doubles as a pre-send preview: `invoice.invoiceNumber` is null until the
// owner actually sends it, since nothing is persisted before that point.
export default function InvoicePdfPreview({ invoice, billing }) {
  const period = formatPeriod(invoice.periodStart, invoice.periodEnd);
  return (
    <div className="pdf-preview">
      <div className="pdf-header">
        <div className="pdf-brand">
          <img src={logo} className="pdf-logo" alt="" />
          Scholtz Scholar Service
        </div>
        <div className="pdf-meta">
          <div className="pdf-invoice-label">INVOICE</div>
          <div>Invoice #{invoice.invoiceNumber ?? 'Pending'}</div>
          <div>Issued {new Date(invoice.issuedDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div>Due {new Date(invoice.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
      <div className="pdf-rule" />

      <div className="pdf-bill-to">
        <div className="pdf-label">BILL TO</div>
        <div className="pdf-bill-name">{billing?.name}</div>
        <div>{billing?.phone}</div>
      </div>

      <table className="pdf-table">
        <thead>
          <tr>
            <th>SCHOLAR</th>
            <th>PERIOD</th>
            <th>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li) => (
            <tr key={li.id ?? li.scholarId}>
              <td>
                <div className="pdf-scholar-name">{li.scholarName}</div>
                <div className="pdf-scholar-meta">
                  {li.school}
                  {li.transportPlan ? ` · ${li.transportPlan}` : ''}
                </div>
                {li.notifyAddon && <div className="pdf-scholar-meta">+ WhatsApp notifications: R{li.addonAmount.toFixed(2)}</div>}
              </td>
              <td>{period}</td>
              <td>R{(li.amount + (li.addonAmount || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pdf-totals">
        <div>
          <span>Subtotal</span>
          <strong>R{invoice.subtotal.toFixed(2)}</strong>
        </div>
        <div className="pdf-total-final">
          <span>Total due</span>
          <strong>R{invoice.total.toFixed(2)}</strong>
        </div>
      </div>

      <div className="pdf-bank-box">
        <div className="pdf-label">PAYMENT DETAILS</div>
        <div className="pdf-bank-row">
          <span>Bank</span>
          <span>FirstBank South Africa</span>
        </div>
        <div className="pdf-bank-row">
          <span>Account name</span>
          <span>Scholtz Scholar Service</span>
        </div>
        <div className="pdf-bank-row">
          <span>Account number</span>
          <span>62481 190 774</span>
        </div>
        <div className="pdf-bank-row">
          <span>Branch code</span>
          <span>250 655</span>
        </div>
        <div className="pdf-bank-row">
          <span>Reference</span>
          <span>{invoice.invoiceNumber ?? 'Assigned when sent'}</span>
        </div>
      </div>

      <p className="pdf-footer">Scholtz Scholar Service · WhatsApp 083 555 0142</p>
    </div>
  );
}
