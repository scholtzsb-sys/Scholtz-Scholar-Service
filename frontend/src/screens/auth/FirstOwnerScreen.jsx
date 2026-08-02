import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Screen, TopBar, Button, Field, TextInput, Toggle } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';

export default function FirstOwnerScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addOwner, startSession } = useAppActions();
  const phone = location.state?.phone;

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [alsoDrives, setAlsoDrives] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');

  useEffect(() => {
    if (!phone) navigate('/', { replace: true });
  }, [phone, navigate]);

  if (!phone) return null;

  const canSubmit = name.trim() && password.length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const owner = { name: name.trim(), phone, password, alsoDrives, vehicleReg: alsoDrives ? vehicleReg.trim() : '' };
    const ownerId = addOwner(owner);
    startSession({ role: 'owner', ownerId, phone });
    navigate('/owner', { replace: true, state: { justBootstrapped: true } });
  }

  return (
    <Screen maxWidth={420}>
      <TopBar title="Welcome — let's set you up" />
      <p className="first-owner-intro">
        No owner account exists yet for <strong>{phone}</strong> — you'll be the first. Set a password to log in with next time.
      </p>
      <form className="first-owner-form" onSubmit={handleSubmit}>
        <Field label="Your name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
        </Field>
        <Toggle checked={alsoDrives} onChange={setAlsoDrives} label="I also drive" />
        {alsoDrives && (
          <Field label="Vehicle registration">
            <TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. CA 123-456" />
          </Field>
        )}
        <Button type="submit" full size="lg" disabled={!canSubmit}>
          Create owner account
        </Button>
      </form>
    </Screen>
  );
}
