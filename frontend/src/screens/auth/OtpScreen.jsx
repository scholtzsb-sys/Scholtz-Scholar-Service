import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Button, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions, findRolesForPhone } from '../../state/AppContext';

const DEMO_CODE = '123456';
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { state } = useApp();
  const { startSession, cancelAuth } = useAppActions();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  const phone = state.pendingAuth?.phone;

  useEffect(() => {
    if (!phone) navigate('/', { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleDigit(i, value) {
    const v = value.replace(/[^\d]/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function handleVerify() {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Enter all 6 digits.');
      return;
    }
    if (code !== DEMO_CODE) {
      setError(`Incorrect code. Demo code is ${DEMO_CODE}.`);
      return;
    }
    setError('');

    if (state.owners.length === 0) {
      navigate('/first-owner', { state: { phone } });
      return;
    }

    const roles = findRolesForPhone(state, phone);
    if (roles.length === 0) {
      setError('No owner or driver account found for this number.');
      return;
    }
    if (roles.length === 1) {
      startSession({ ...roles[0], phone });
      navigate(roles[0].role === 'owner' ? '/owner' : '/driver', { replace: true });
      return;
    }
    navigate('/continue-as', { state: { phone, roles } });
  }

  function handleEdit() {
    cancelAuth();
    navigate('/');
  }

  if (!phone) return null;

  return (
    <Screen maxWidth={420}>
      <TopBar title="Verify your number" onBack={handleEdit} />
      <p className="otp-subtitle">
        Enter the 6-digit code sent to <strong>{phone}</strong>.{' '}
        <button type="button" className="link-btn" onClick={handleEdit}>
          Edit
        </button>
      </p>

      <div className="otp-boxes">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            className="otp-box"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <EmptyState title={error} />}

      <Button full size="lg" onClick={handleVerify}>
        Verify
      </Button>

      <p className="otp-resend">
        {countdown > 0 ? (
          `Resend code in ${countdown}s`
        ) : (
          <button type="button" className="link-btn" onClick={() => setCountdown(RESEND_SECONDS)}>
            Resend code
          </button>
        )}
      </p>
      <p className="otp-demo-hint">Demo code: {DEMO_CODE}</p>
    </Screen>
  );
}
