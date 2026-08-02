import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, TopBar, Card, Button, Field, TextInput, Select, Toggle, Badge, EmptyState } from '../../components/ui/Primitives';
import { useApp, useAppActions } from '../../state/AppContext';
import { TRANSPORT_PLANS } from '../../lib/mockData';
import { guardiansForScholar } from '../../lib/selectors';
import './owner.css';

function newContactId() {
  return `guardian-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function emptyContact(type) {
  return {
    id: newContactId(),
    isExisting: false,
    type,
    name: '',
    phone: '',
    notify: true,
    isBillingContact: false,
    billingChannel: 'whatsapp',
    email: '',
  };
}

export default function ScholarFormScreen({ edit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { addScholar, updateScholar, addSchool } = useAppActions();

  const existing = edit ? state.scholars.find((s) => s.id === id) : null;

  const [siblingOfId, setSiblingOfId] = useState('');
  const [name, setName] = useState(existing?.name ?? '');
  const [grade, setGrade] = useState(existing?.grade ?? '');
  const [schoolId, setSchoolId] = useState(existing?.schoolId ?? '');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [addingSchool, setAddingSchool] = useState(false);
  const [homeAddress, setHomeAddress] = useState(existing?.homeAddress ?? '');
  const [transportPlan, setTransportPlan] = useState(existing?.transportPlan ?? 'full');
  const [feePerMonth, setFeePerMonth] = useState(existing?.feePerMonth ?? '');
  const [notifyAddon, setNotifyAddon] = useState(existing?.notifyAddon ?? false);
  const [contacts, setContacts] = useState(() => {
    if (!existing) return [];
    return guardiansForScholar(state, existing).map((g) => ({ ...g, isExisting: true }));
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const siblingCandidates = state.scholars.filter((s) => s.active && s.id !== id);

  function handleSiblingSelect(siblingId) {
    setSiblingOfId(siblingId);
    if (!siblingId) return;
    const sibling = state.scholars.find((s) => s.id === siblingId);
    if (!sibling) return;
    setSchoolId(sibling.schoolId);
    setHomeAddress(sibling.homeAddress);
    setContacts(guardiansForScholar(state, sibling).map((g) => ({ ...g, isExisting: true })));
  }

  function addContact(type) {
    setContacts((cs) => [...cs, emptyContact(type)]);
  }

  function updateContact(cid, patch) {
    setContacts((cs) =>
      cs.map((c) => {
        if (c.id !== cid) {
          // Only one parent per family can be the billing contact.
          if (patch.isBillingContact && c.type === 'parent') return { ...c, isBillingContact: false };
          return c;
        }
        return { ...c, ...patch };
      })
    );
  }

  function removeContact(cid) {
    setContacts((cs) => cs.filter((c) => c.id !== cid));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      let finalSchoolId = schoolId;
      if (addingSchool && newSchoolName.trim()) {
        finalSchoolId = await addSchool(newSchoolName.trim());
      }

      const guardianLinks = contacts.map((c) => {
        const base = {
          notify: c.notify,
          name: c.name.trim(),
          phone: c.phone.trim(),
          type: c.type,
          isBillingContact: c.isBillingContact,
          billingChannel: c.isBillingContact ? c.billingChannel : null,
          email: c.isBillingContact && c.billingChannel === 'email' ? c.email.trim() : '',
        };
        return c.isExisting ? { ...base, guardianId: c.id } : base;
      });

      const scholarPayload = {
        name: name.trim(),
        grade: grade.trim(),
        schoolId: finalSchoolId,
        homeAddress: homeAddress.trim(),
        transportPlan,
        guardianLinks,
        feePerMonth: Number(feePerMonth) || 0,
        notifyAddon,
      };

      if (edit && existing) {
        await updateScholar(existing.id, scholarPayload);
        navigate(`/owner/scholars/${existing.id}`);
      } else {
        const newId = await addScholar(scholarPayload);
        navigate(`/owner/scholars/${newId}`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <TopBar title={edit ? 'Edit scholar' : 'Register a new scholar'} onBack={() => navigate(-1)} />

      <form className="form-section" onSubmit={handleSubmit}>
        {!edit && (
          <Field label="Sibling of an existing scholar?" hint="Auto-fills school, address, and parent/guardian list">
            <Select value={siblingOfId} onChange={(e) => handleSiblingSelect(e.target.value)}>
              <option value="">Not a sibling</option>
              {siblingCandidates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Full name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Scholar's full name" required />
        </Field>

        <Field label="Grade">
          <TextInput value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 5" />
        </Field>

        {!addingSchool ? (
          <Field label="School">
            <Select
              value={schoolId}
              required
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setAddingSchool(true);
                  setSchoolId('');
                } else {
                  setSchoolId(e.target.value);
                }
              }}
            >
              <option value="">Select a school</option>
              {state.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__new__">+ Add new school</option>
            </Select>
          </Field>
        ) : (
          <Field label="New school name">
            <TextInput
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              placeholder="e.g. Oakwood Primary"
              autoFocus
              required
            />
            <button type="button" className="link-btn" onClick={() => setAddingSchool(false)}>
              Choose existing school instead
            </button>
          </Field>
        )}

        <Field label="Home pickup address">
          <TextInput
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            placeholder="e.g. 4 Oak Avenue, Rondebosch, Cape Town"
            required
          />
        </Field>

        <Field label="Transport plan">
          <div className="form-row">
            {Object.values(TRANSPORT_PLANS).map((plan) => (
              <label key={plan.value} className="toggle-row" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="transportPlan"
                  checked={transportPlan === plan.value}
                  onChange={() => setTransportPlan(plan.value)}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>{plan.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Fee per month (R)">
          <TextInput type="number" min="0" value={feePerMonth} onChange={(e) => setFeePerMonth(e.target.value)} placeholder="e.g. 850" />
        </Field>

        <Field label="WhatsApp notifications add-on (R100/month)" hint="Guaranteed delivery. Independent of trip tracking, which always happens.">
          <Toggle checked={notifyAddon} onChange={setNotifyAddon} label={notifyAddon ? 'Enabled' : 'Disabled'} />
        </Field>

        <div>
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Parents &amp; guardians</span>
          </div>
          <div className="add-contact-row">
            <Button type="button" variant="secondary" size="sm" onClick={() => addContact('parent')}>
              + Add parent
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addContact('guardian')}>
              + Add guardian
            </Button>
          </div>
        </div>

        {contacts.map((c) => (
          <Card key={c.id} className="guardian-card">
            <div className="guardian-card-top">
              <Badge tone={c.type === 'parent' ? 'success' : 'neutral'}>{c.type === 'parent' ? 'Parent' : 'Guardian'}</Badge>
              <button type="button" className="guardian-remove" onClick={() => removeContact(c.id)}>
                Remove
              </button>
            </div>
            <Field label="Name">
              <TextInput value={c.name} onChange={(e) => updateContact(c.id, { name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <TextInput value={c.phone} onChange={(e) => updateContact(c.id, { phone: e.target.value })} placeholder="e.g. 082 123 4567" />
            </Field>
            <Toggle
              checked={c.notify}
              onChange={(v) => updateContact(c.id, { notify: v })}
              label="Pickup/drop-off notifications"
            />
            {c.type === 'parent' && (
              <>
                <Toggle
                  checked={c.isBillingContact}
                  onChange={(v) => updateContact(c.id, { isBillingContact: v })}
                  label="Bill invoices to this parent"
                />
                {c.isBillingContact && (
                  <Field label="Invoice delivery">
                    <Select value={c.billingChannel} onChange={(e) => updateContact(c.id, { billingChannel: e.target.value })}>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </Select>
                  </Field>
                )}
                {c.isBillingContact && c.billingChannel === 'email' && (
                  <Field label="Email address">
                    <TextInput type="email" value={c.email} onChange={(e) => updateContact(c.id, { email: e.target.value })} />
                  </Field>
                )}
              </>
            )}
          </Card>
        ))}

        {error && <EmptyState title={error} />}
        <Button type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Saving…' : edit ? 'Save changes' : 'Register scholar'}
        </Button>
      </form>
    </Screen>
  );
}
