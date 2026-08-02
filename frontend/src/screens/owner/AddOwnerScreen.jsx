import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Field, TextInput, Toggle } from '../../components/ui/Primitives';
import ScholarAssignmentPicker from '../../components/ScholarAssignmentPicker';
import { useAppActions } from '../../state/AppContext';
import './owner.css';

export default function AddOwnerScreen() {
  const navigate = useNavigate();
  const { addOwner, addDriver } = useAppActions();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alsoDrives, setAlsoDrives] = useState(false);
  const [vehicleReg, setVehicleReg] = useState('');
  const [assignedIds, setAssignedIds] = useState([]);
  const [savedName, setSavedName] = useState(null);

  const canSubmit = name.trim() && phone.trim() && (!alsoDrives || vehicleReg.trim());

  function reset() {
    setName('');
    setPhone('');
    setAlsoDrives(false);
    setVehicleReg('');
    setAssignedIds([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    addOwner({ name: name.trim(), phone: phone.trim(), alsoDrives: false });
    if (alsoDrives) {
      addDriver({ name: name.trim(), phone: phone.trim(), vehicleReg: vehicleReg.trim(), linkedOwnerId: null }, assignedIds);
    }
    setSavedName(name.trim());
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
        <Button type="submit" full size="lg" disabled={!canSubmit}>
          Save owner
        </Button>
      </form>
    </Screen>
  );
}
