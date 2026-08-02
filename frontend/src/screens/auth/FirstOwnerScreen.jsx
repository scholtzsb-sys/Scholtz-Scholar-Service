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
  const [alsoDrives, setAlsoDrives] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');

  useEffect(() => {
    if (!phone) navigate('/', { replace: true });
  }, [phone, navigate]);

  if (!phone) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const owner = { name: name.trim(), phone, alsoDrives, vehicleReg: alsoDrives ? vehicleReg.trim() : '' };
    const ownerId = addOwner(owner);
    startSession({ role: 'owner', ownerId, phone });
    navigate('/owner', { replace: true, state: { justBootstrapped: true } });
  }

  return (
    <Screen maxWidth={420}>
      <TopBar title="Welcome — let's set you up" />
      <p className="first-owner-intro">
        Your number <strong>{phone}</strong> is verified. No owner account exists yet — you'll be the first.
      </p>
      <form className="first-owner-form" onSubmit={handleSubmit}>
        <Field label="Your name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </Field>
        <Toggle checked={alsoDrives} onChange={setAlsoDrives} label="I also drive" />
        {alsoDrives && (
          <Field label="Vehicle registration">
            <TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. CA 123-456" />
          </Field>
        )}
        <Button type="submit" full size="lg" disabled={!name.trim()}>
          Create owner account
        </Button>
      </form>
    </Screen>
  );
}
