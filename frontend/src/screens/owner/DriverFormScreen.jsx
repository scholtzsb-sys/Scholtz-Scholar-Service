import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Button, Field, TextInput } from '../../components/ui/Primitives';
import ScholarAssignmentPicker from '../../components/ScholarAssignmentPicker';
import { useApp, useAppActions } from '../../state/AppContext';
import './owner.css';

export default function DriverFormScreen({ edit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { addDriver, updateDriver } = useAppActions();

  const existing = edit ? state.drivers.find((d) => d.id === id) : null;
  const existingAssigned = existing
    ? state.scholars
        .filter((s) => s.driverId === existing.id && s.active)
        .sort((a, b) => (a.pickupOrder ?? 0) - (b.pickupOrder ?? 0))
        .map((s) => s.id)
    : [];

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [password, setPassword] = useState('');
  const [vehicleReg, setVehicleReg] = useState(existing?.vehicleReg ?? '');
  const [assignedIds, setAssignedIds] = useState(existingAssigned);

  const canSubmit = name.trim() && phone.trim() && vehicleReg.trim() && (edit || password.length > 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = { name: name.trim(), phone: phone.trim(), vehicleReg: vehicleReg.trim() };
    if (password.length > 0) payload.password = password;
    if (edit && existing) {
      updateDriver(existing.id, payload, assignedIds);
      navigate(`/owner/drivers/${existing.id}`);
    } else {
      const newId = addDriver({ ...payload, linkedOwnerId: null }, assignedIds);
      navigate(`/owner/drivers/${newId}`);
    }
  }

  return (
    <Screen>
      <TopBar title={edit ? 'Edit driver' : 'Register a new driver'} onBack={() => navigate(-1)} />
      <form className="form-section" onSubmit={handleSubmit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Driver's full name" autoFocus />
        </Field>
        <Field label="Phone number">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 123 4567" />
        </Field>
        <Field label="Password" hint={edit ? 'Leave blank to keep their current password.' : "Share this with them directly — it's what they'll log in with."}>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={edit ? 'New password (optional)' : 'Choose a password'}
          />
        </Field>
        <Field label="Vehicle registration">
          <TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. CA 123-456" />
        </Field>

        <div>
          <span className="section-heading">Assigned scholars (pickup order)</span>
          <ScholarAssignmentPicker assignedIds={assignedIds} onChange={setAssignedIds} excludeDriverId={existing?.id} />
        </div>

        <Button type="submit" full size="lg" disabled={!canSubmit}>
          {edit ? 'Save changes' : 'Register driver'}
        </Button>
      </form>
    </Screen>
  );
}
