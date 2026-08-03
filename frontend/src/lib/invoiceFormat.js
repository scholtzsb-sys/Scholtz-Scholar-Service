// Invoices cover an owner-chosen date range, not necessarily a calendar
// month — collapse to "August 2026" when the range happens to be one full
// month, otherwise show the explicit start–end dates.
export function formatPeriod(periodStart, periodEnd) {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  const isFullMonth =
    sameMonth &&
    start.getDate() === 1 &&
    end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

  if (isFullMonth) {
    return start.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }
  const fmt = (d) => d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

const STATUS_META = {
  PAID: { label: 'Paid', tone: 'success' },
  PARTIAL: { label: 'Partially paid', tone: 'warning' },
  UNPAID: { label: 'Unpaid', tone: 'danger' },
};

export function invoiceStatusMeta(status) {
  return STATUS_META[status] ?? STATUS_META.UNPAID;
}

export function balanceDue(invoice) {
  return Math.max(0, invoice.total - invoice.amountPaid);
}

// Deliberately not toISOString() — that converts to UTC first, which rolls
// the date backward a day for any timezone ahead of UTC (e.g. South Africa,
// UTC+2). Format straight from the Date's own local components instead.
function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}
