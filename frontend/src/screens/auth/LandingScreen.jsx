import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Button, Field, TextInput, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions, findRolesForCredentials, phoneHasAnyAccount } from '../../state/AppContext';
import { DEMO_PASSWORD } from '../../lib/mockData';
import logo from '../../assets/logo.png';

function formatPhoneDigits(value) {
  return value.replace(/[^\d]/g, '').slice(0, 10);
}

export default function LandingScreen() {
  const { state } = useApp();
  const { startSession } = useAppActions();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const phoneValid = phone.length === 10;

  // No owner exists yet anywhere in the system — there's nothing to log
  // into, so skip straight to the one-time bootstrap flow.
  if (state.owners.length === 0) {
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

  const valid = phoneValid && password.length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;

    const roles = findRolesForCredentials(state, phone, password);
    if (roles.length === 0) {
      setError(phoneHasAnyAccount(state, phone) ? 'Incorrect password.' : 'No owner or driver account found for this number.');
      return;
    }
    setError('');

    if (roles.length === 1) {
      startSession({ ...roles[0], phone });
      navigate(roles[0].role === 'owner' ? '/owner' : '/driver', { replace: true });
      return;
    }
    navigate('/continue-as', { state: { phone, roles } });
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
          Log in
        </Button>
        <p className="otp-demo-hint">Demo accounts use password: {DEMO_PASSWORD}</p>
      </form>
    </Screen>
  );
}
