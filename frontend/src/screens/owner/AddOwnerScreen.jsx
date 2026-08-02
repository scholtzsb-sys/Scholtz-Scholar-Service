import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Field, TextInput, Toggle, EmptyState } from '../../components/ui/Primitives';
import ScholarAssignmentPicker from '../../components/ScholarAssignmentPicker';
import { useAppActions } from '../../state/AppContext';
import './owner.css';

export default function AddOwnerScreen() {
  const navigate = useNavigate();
  const { addOwner } = useAppActions();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [alsoDrives, setAlsoDrives] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');
  const [assignedIds, setAssignedIds] = useState([]);
  const [savedName, setSavedName] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && phone.trim() && password.length > 0 && (!alsoDrives || vehicleReg.trim()) && !submitting;

  function reset() {
    setName('');
    setPhone('');
    setPassword('');
    setAlsoDrives(false);
    setVehicleReg('');
    setAssignedIds([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await addOwner({
        name: name.trim(),
        phone: phone.trim(),
        password,
        alsoDrives,
        vehicleReg: alsoDrives ? vehicleReg.trim() : '',
        assignedScholarIds: alsoDrives ? assignedIds : [],
      });
      setSavedName(name.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (savedName) {
    return (
      <Screen>
        <TopBar title="Owner added" onBack={() => navigate('/owner/profile')} />
        <Card>
          <p>
            <strong>{savedName}</strong> has been added as an owner.
          </p>
        </Card>
        <div className="form-row">
          <Button
            onClick={() => {
              reset();
              setSavedName(null);
            }}
          >
            Add another owner
          </Button>
          <Button variant="secondary" onClick={() => navigate('/owner/profile')}>
            Done
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Add owner" onBack={() => navigate('/owner/profile')} />
      <form className="form-section" onSubmit={handleSubmit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </Field>
        <Field label="Phone number">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 123 4567" />
        </Field>
        <Field label="Password" hint="Share this with them directly — it's what they'll log in with.">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
        </Field>
        <Toggle checked={alsoDrives} onChange={setAlsoDrives} label="I also drive" />
        {alsoDrives && (
          <>
            <Field label="Vehicle registration">
              <TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. CA 123-456" />
            </Field>
            <div>
              <span className="section-heading">Assigned scholars (pickup order)</span>
              <ScholarAssignmentPicker assignedIds={assignedIds} onChange={setAssignedIds} />
            </div>
          </>
        )}
        {error && <EmptyState title={error} />}
        <Button type="submit" full size="lg" disabled={!canSubmit}>
          {submitting ? 'Saving…' : 'Save owner'}
        </Button>
      </form>
    </Screen>
  );
}
