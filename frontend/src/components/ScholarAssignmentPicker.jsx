import { useState } from 'react';
import { Button, Card, EmptyState } from './ui/Primitives';
import { useApp } from '../state/AppContext';
import { schoolName } from '../lib/selectors';

// Lets an owner build an ordered stop list for a driver. `assignedIds` is
// ordered — index determines pickup order. `excludeDriverId` allows a
// scholar already on *this* driver to stay pickable while editing.
export default function ScholarAssignmentPicker({ assignedIds, onChange, excludeDriverId }) {
  const { state } = useApp();
  const [pickerOpen, setPickerOpen] = useState(false);

  const assignedScholars = assignedIds.map((id) => state.scholars.find((s) => s.id === id)).filter(Boolean);

  const pickable = state.scholars.filter(
    (s) => s.active && !assignedIds.includes(s.id) && (!s.driverId || s.driverId === excludeDriverId)
  );

  function add(scholarId) {
    onChange([...assignedIds, scholarId]);
    setPickerOpen(false);
  }

  function remove(scholarId) {
    onChange(assignedIds.filter((id) => id !== scholarId));
  }

  function move(index, dir) {
    const next = [...assignedIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="assignment-picker">
      {assignedScholars.length === 0 && <EmptyState title="No scholars assigned yet" body="Add scholars from the list below." />}
      <div className="assignment-list">
        {assignedScholars.map((s, i) => (
          <Card key={s.id} className="assignment-tile">
            <span className="assignment-order">{i + 1}</span>
            <div className="assignment-info">
              <strong>{s.name}</strong>
              <span className="assignment-meta">🏫 {schoolName(state, s.schoolId)}</span>
              <span className="assignment-meta">📍 {s.homeAddress}</span>
            </div>
            <div className="assignment-actions">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === assignedScholars.length - 1} aria-label="Move down">
                ↓
              </button>
              <button type="button" className="icon-btn" onClick={() => remove(s.id)} aria-label="Remove">
                ✕
              </button>
            </div>
          </Card>
        ))}
      </div>

      {!pickerOpen && (
        <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
          + Add a scholar
        </Button>
      )}

      {pickerOpen && (
        <Card className="assignment-add-list">
          {pickable.length === 0 ? (
            <EmptyState title="No unassigned scholars available" />
          ) : (
            pickable.map((s) => (
              <button type="button" key={s.id} className="assignment-pick-row" onClick={() => add(s.id)}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="assignment-meta">
                    🏫 {schoolName(state, s.schoolId)} · 📍 {s.homeAddress}
                  </div>
                </div>
                <span>+</span>
              </button>
            ))
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
            Close
          </Button>
        </Card>
      )}
    </div>
  );
}
