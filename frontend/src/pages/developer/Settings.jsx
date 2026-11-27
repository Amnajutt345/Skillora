import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Field, PageHead } from '../../components/ui.jsx';

const FIELDS = ['fullName', 'title', 'location', 'contact', 'education', 'experience', 'bio'];

export default function Settings() {
  const { user, profile, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((field) => [field, profile?.[field] || ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.updateDeveloper(profile.id, form);
      refresh();
      toast.success('Settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHead title="Developer Settings" subtitle="Account details and editable profile information." />
      <div className="grid2">
        <section className="card stack">
          <h2>Account information</h2>
          <p><b>Email</b><br /><span className="muted">{user.email}</span></p>
          <p><b>Account type</b><br /><span className="muted">Developer</span></p>
          <p className="muted small">Email and password changes are not available in this application.</p>
        </section>
        <section className="card stack">
          <h2>Profile information</h2>
          <Field label="Full name"><input className="in" required value={form.fullName} onChange={update('fullName')} /></Field>
          <Field label="Professional title"><input className="in" value={form.title} onChange={update('title')} /></Field>
          <Field label="Location"><input className="in" value={form.location} onChange={update('location')} /></Field>
          <Field label="Contact information"><input className="in" value={form.contact} onChange={update('contact')} /></Field>
        </section>
      </div>
      <section className="card stack">
        <h2>Background on your profile</h2>
        <Field label="Education"><input className="in" value={form.education} onChange={update('education')} /></Field>
        <Field label="Experience"><input className="in" value={form.experience} onChange={update('experience')} /></Field>
        <Field label="Short bio"><textarea className="in" rows="4" value={form.bio} onChange={update('bio')} /></Field>
      </section>
      <section className="card stack">
        <h2>Notifications</h2>
        <p className="muted">Application updates are shown in your in-app Notifications page. Notification preference controls are not currently supported.</p>
      </section>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </form>
  );
}
