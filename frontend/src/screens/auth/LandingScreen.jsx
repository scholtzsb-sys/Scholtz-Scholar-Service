import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Button, Field, TextInput, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { api } from '../../lib/api';
import { DEMO_PASSWORD } from '../../lib/mockData';
import logo from '../../assets/logo.png';

function formatPhoneDigits(value) {
  return value.replace(/[^\d]/g, '').slice(0, 10);
}

export default function LandingScreen() {
  const { state } = useApp();
  const { login } = useAppActions();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ownersExist, setOwnersExist] = useState(null); // null while checking

  useEffect(() => {
    if (state.authLoading) return; // avoid a redundant check before a stored token even resolves
    api
      .ownersExist()
      .then((r) => setOwnersExist(r.exists))
      .catch(() => setOwnersExist(true)); // fail closed to the login form, not the bootstrap flow
  }, [state.authLoading]);

  // A stored token already resolved to a session — skip the login form.
  useEffect(() => {
    if (state.session) {
      navigate(state.session.role === 'owner' ? '/owner' : '/driver', { replace: true });
    }
  }, [state.session, navigate]);

  if (state.authLoading || state.session || ownersExist === null) return null;

  const phoneValid = phone.length === 10;

  // No owner exists yet anywhere in the system — there's nothing to log
  // into, so skip straight to the one-time bootstrap flow.
  if (!ownersExist) {
    return (
      <Screen maxWidth={420}>
        <div className="landing-hero">
          <img src={logo} className="landing-logo" alt="Scholtz Scholar Service" />
          <h1 className="landing-title">Scholtz Scholar Service</h1>
          <p className="landing-trust">No owner account exists yet — let's set one up.</p>
        </div>
        <form
          className="landing-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (phoneValid) navigate('/first-owner', { state: { phone } });
          }}
        >
          <Field label="Phone number">
            <TextInput
              type="tel"
              inputMode="numeric"
              placeholder="082 123 4567"
              value={phone}
              onChange={(e) => setPhone(formatPhoneDigits(e.target.value))}
              autoFocus
            />
          </Field>
          <Button type="submit" full size="lg" disabled={!phoneValid}>
            Get started
          </Button>
        </form>
      </Screen>
    );
  }

  const valid = phoneValid && password.length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await login(phone, password);
      if (result.roles) {
        navigate('/continue-as', { state: { phone, password, roles: result.roles } });
        return;
      }
      navigate(result.session.role === 'owner' ? '/owner' : '/driver', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen maxWidth={420}>
      <div className="landing-hero">
        <img src={logo} className="landing-logo" alt="Scholtz Scholar Service" />
        <h1 className="landing-title">Scholtz Scholar Service</h1>
        <p className="landing-trust">Safe, tracked scholar transport — for owners and drivers.</p>
      </div>
      <form onSubmit={handleSubmit} className="landing-form">
        <Field label="Phone number">
          <TextInput
            type="tel"
            inputMode="numeric"
            placeholder="082 123 4567"
            value={phone}
            onChange={(e) => setPhone(formatPhoneDigits(e.target.value))}
            autoFocus
          />
        </Field>
        <Field label="Password">
          <div className="password-field">
            <TextInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="link-btn password-toggle" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        {error && <EmptyState title={error} />}
        <Button type="submit" full size="lg" disabled={!valid}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
        <p className="otp-demo-hint">Demo accounts use password: {DEMO_PASSWORD}</p>
      </form>
    </Screen>
  );
}
