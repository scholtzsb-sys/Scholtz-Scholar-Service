import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Screen, TopBar, Button, Field, TextInput, Toggle, EmptyState } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';

export default function FirstOwnerScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { firstOwner } = useAppActions();
  const phone = location.state?.phone;

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [alsoDrives, setAlsoDrives] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!phone) navigate('/', { replace: true });
  }, [phone, navigate]);

  if (!phone) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await firstOwner({ name: name.trim(), phone, password, alsoDrives, vehicleReg: alsoDrives ? vehicleReg.trim() : '' });
      navigate('/owner', { replace: true, state: { justBootstrapped: true } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen maxWidth={420}>
      <TopBar title="Welcome — let's set you up" />
      <p className="first-owner-intro">
        No owner account exists yet for <strong>{phone}</strong> — you'll be the first. Set a password to log in with next time.
      </p>
      <form className="first-owner-form" onSubmit={handleSubmit}>
        <Field label="Your name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus required />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            required
          />
        </Field>
        <Toggle checked={alsoDrives} onChange={setAlsoDrives} label="I also drive" />
        {alsoDrives && (
          <Field label="Vehicle registration">
            <TextInput
              value={vehicleReg}
              onChange={(e) => setVehicleReg(e.target.value)}
              placeholder="e.g. CA 123-456"
              required
            />
          </Field>
        )}
        {error && <EmptyState title={error} />}
        <Button type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create owner account'}
        </Button>
      </form>
    </Screen>
  );
}
