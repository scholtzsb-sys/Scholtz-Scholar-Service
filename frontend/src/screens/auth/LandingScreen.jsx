import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Button, Field, TextInput } from '../../components/ui/Primitives';
import { useAppActions } from '../../state/AppContext';

function formatPhoneDigits(value) {
  return value.replace(/[^\d]/g, '').slice(0, 10);
}

export default function LandingScreen() {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const { requestOtp } = useAppActions();

  const valid = phone.length === 10;

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    requestOtp(phone);
    navigate('/otp');
  }

  return (
    <Screen maxWidth={420}>
      <div className="landing-hero">
        <div className="landing-logo">SSS</div>
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
        <Button type="submit" full size="lg" disabled={!valid}>
          Continue
        </Button>
      </form>
    </Screen>
  );
}
