import { useState } from 'react';
import { Chip } from './ui.jsx';

// Skills are always chosen from the admin-managed catalogue.
export default function SkillPicker({ value, onChange, catalogue }) {
  const [pick, setPick] = useState('');
  const options = catalogue.filter((s) => !value.some((v) => v.toLowerCase() === s.name.toLowerCase()));
  const add = () => {
    if (!pick) return;
    onChange([...value, pick]);
    setPick('');
  };
  return (
    <div>
      <div className="chips">
        {value.length === 0 && <span className="muted">No skills added yet.</span>}
        {value.map((s) => (
          <Chip key={s}>
            {s}
            <button type="button" className="x" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((v) => v !== s))}>
              ×
            </button>
          </Chip>
        ))}
      </div>
      <div className="row">
        <select className="in" aria-label="Skill to add" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Choose a skill…</option>
          {options.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name} ({s.category})
            </option>
          ))}
        </select>
        <button type="button" className="btn ghost" onClick={add} disabled={!pick}>
          Add Skill
        </button>
      </div>
    </div>
  );
}
