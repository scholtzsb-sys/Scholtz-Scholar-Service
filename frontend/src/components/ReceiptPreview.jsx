import logo from '../assets/logo.png';
import { balanceDue } from '../lib/invoiceFormat';
import './invoicePdfPreview.css';

// Reuses the invoice PDF's brand styling (navy/yellow/sky-blue) — a receipt
// is the same kind of external-facing document as the invoice itself.
export default function ReceiptPreview({ invoice, billing, payment }) {
  return (
    <div className="pdf-preview">
      <div className="pdf-header">
        <div className="pdf-brand">
          <img src={logo} className="pdf-logo" alt="" />
          Scholtz Scholar Service
        </div>
        <div className="pdf-meta">
          <div className="pdf-invoice-label">RECEIPT</div>
          <div>For invoice #{invoice.invoiceNumber}</div>
          <div>
            Date{' '}
            {new Date(payment.paidAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="pdf-rule" />

      <div className="pdf-bill-to">
        <div className="pdf-label">RECEIVED FROM</div>
        <div className="pdf-bill-name">{billing?.name}</div>
        <div>{billing?.phone}</div>
      </div>

      <div className="pdf-bank-box">
        <div className="pdf-label">STATEMENT</div>
        <div className="pdf-bank-row">
          <span>Invoice total</span>
          <span>R{invoice.total.toFixed(2)}</span>
        </div>
        <div className="pdf-bank-row">
          <span>This payment</span>
          <span>R{payment.amount.toFixed(2)}</span>
        </div>
        <div className="pdf-bank-row">
          <span>Total paid to date</span>
          <span>R{invoice.amountPaid.toFixed(2)}</span>
        </div>
        <div className="pdf-bank-row">
          <span>Balance remaining</span>
          <span>R{balanceDue(invoice).toFixed(2)}</span>
        </div>
      </div>

      <p className="pdf-footer">Scholtz Scholar Service · WhatsApp 083 555 0142</p>
    </div>
  );
}
