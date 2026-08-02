import { Link, useNavigate } from 'react-router-dom';
import { initials } from '../../lib/palette';
import './primitives.css';

export function Screen({ children, maxWidth = 480 }) {
  return (
    <div className="screen" style={{ maxWidth }}>
      {children}
    </div>
  );
}

export function TopBar({ title, onBack, avatarTo, avatarLabel }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onBack && (
          <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
            ‹
          </button>
        )}
        {title && <h1 className="topbar-title">{title}</h1>}
      </div>
      {avatarTo && (
        <Link to={avatarTo} className="avatar-btn" aria-label={avatarLabel || 'Profile'}>
          {initials(avatarLabel || '?')}
        </Link>
      )}
    </header>
  );
}

export function BackBar({ title, fallback = '/' }) {
  const navigate = useNavigate();
  return <TopBar title={title} onBack={() => navigate(fallback)} />;
}

export function Button({ children, variant = 'primary', size = 'md', full, ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${full ? 'btn-full' : ''}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function TextInput(props) {
  return <input className="text-input" {...props} />;
}

export function Select({ children, ...rest }) {
  return (
    <select className="text-input" {...rest}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      {label && <span>{label}</span>}
      <span className={`toggle ${checked ? 'toggle-on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
        <span className="toggle-knob" />
      </span>
    </label>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {body && <p className="empty-body">{body}</p>}
      {action}
    </div>
  );
}

export function QuickActionGrid({ actions }) {
  return (
    <div className="quick-grid">
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className="quick-tile">
          <span className="quick-icon" aria-hidden>
            {a.icon}
          </span>
          <span>{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function Avatar({ name, color }) {
  return (
    <span
      className="scholar-avatar"
      style={{ background: color?.bg ?? 'var(--teal-tint)', color: color?.fg ?? 'var(--teal-dark)' }}
    >
      {initials(name)}
    </span>
  );
}

export function CollapsibleSection({ title, count, children, defaultOpen = false }) {
  return (
    <details className="collapsible" open={defaultOpen}>
      <summary>
        {title} {typeof count === 'number' && <span className="collapsible-count">({count})</span>}
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}

export function ConfirmBar({ message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }) {
  return (
    <div className="confirm-bar">
      <p>{message}</p>
      <div className="confirm-actions">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
