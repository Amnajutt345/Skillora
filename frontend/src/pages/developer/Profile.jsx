import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Field, PageHead } from '../../components/ui.jsx';
import SkillPicker from '../../components/SkillPicker.jsx';

const FIELDS = ['fullName', 'title', 'location', 'contact', 'education', 'experience', 'bio'];

export default function Profile() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, profile[f] || ''])));
  const [skills, setSkills] = useState(profile.skills);
  const [catalogue, setCatalogue] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listSkills().then(setCatalogue);
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const filled = FIELDS.filter((f) => form[f].trim()).length + (skills.length ? 1 : 0);
  const percent = Math.round((filled / (FIELDS.length + 1)) * 100);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.updateDeveloper(profile.id, { ...form, skills });
      refresh();
      toast.success('Profile saved.');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={save}>
      <PageHead title="Manage Profile" subtitle="Your details and the skills you claim. GitHub analysis verifies these skills.">
        <span className="chip">Profile completion: {percent}%</span>
      </PageHead>

      <div className="grid2">
        <section className="card stack">
          <h2>Personal and professional details</h2>
          <Field label="Full name"><input className="in" value={form.fullName} onChange={set('fullName')} /></Field>
          <Field label="Professional title"><input className="in" value={form.title} onChange={set('title')} /></Field>
          <Field label="Location"><input className="in" value={form.location} onChange={set('location')} /></Field>
          <Field label="Contact information"><input className="in" value={form.contact} onChange={set('contact')} /></Field>
        </section>
        <section className="card stack">
          <h2>Background</h2>
          <Field label="Education"><input className="in" value={form.education} onChange={set('education')} /></Field>
          <Field label="Experience"><input className="in" value={form.experience} onChange={set('experience')} /></Field>
          <Field label="Short bio"><textarea className="in" rows="4" value={form.bio} onChange={set('bio')} /></Field>
        </section>
      </div>

      <section className="card stack">
        <h2>Skills</h2>
        <p className="muted">Skills come from the Skillora skill catalogue. Run the analysis to see which ones GitHub verifies.</p>
        <SkillPicker value={skills} onChange={setSkills} catalogue={catalogue} />
      </section>

      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
