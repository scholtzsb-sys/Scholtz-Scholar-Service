import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Button, Field, TextInput, EmptyState } from '../../components/ui/Primitives';
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      vehicleReg: vehicleReg.trim(),
      assignedScholarIds: assignedIds,
    };
    if (password.length > 0) payload.password = password;
    try {
      if (edit && existing) {
        await updateDriver(existing.id, payload);
        navigate(`/owner/drivers/${existing.id}`);
      } else {
        const newId = await addDriver(payload);
        navigate(`/owner/drivers/${newId}`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <TopBar title={edit ? 'Edit driver' : 'Register a new driver'} onBack={() => navigate(-1)} />
      <form className="form-section" onSubmit={handleSubmit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Driver's full name" autoFocus required />
        </Field>
        <Field label="Phone number">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 082 123 4567" required />
        </Field>
        <Field label="Password" hint={edit ? 'Leave blank to keep their current password.' : "Share this with them directly — it's what they'll log in with."}>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={edit ? 'New password (optional)' : 'Choose a password'}
            required={!edit}
          />
        </Field>
        <Field label="Vehicle registration">
          <TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. CA 123-456" required />
        </Field>

        <div>
          <span className="section-heading">Assigned scholars (pickup order)</span>
          <ScholarAssignmentPicker assignedIds={assignedIds} onChange={setAssignedIds} excludeDriverId={existing?.id} />
        </div>

        {error && <EmptyState title={error} />}
        <Button type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Saving…' : edit ? 'Save changes' : 'Register driver'}
        </Button>
      </form>
    </Screen>
  );
}
