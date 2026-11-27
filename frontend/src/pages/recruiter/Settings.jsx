import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Field, PageHead } from '../../components/ui.jsx';

const FIELDS = ['recruiterName', 'companyName', 'description', 'industry', 'website', 'contact', 'location'];

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
      await api.updateRecruiter(profile.id, form);
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
      <PageHead title="Recruiter Settings" subtitle="Account details and editable company profile information." />
      <div className="grid2">
        <section className="card stack">
          <h2>Account information</h2>
          <p><b>Email</b><br /><span className="muted">{user.email}</span></p>
          <p><b>Account type</b><br /><span className="muted">Recruiter</span></p>
          <p className="muted small">Email and password changes are not available in this application.</p>
        </section>
        <section className="card stack">
          <h2>Company and contact details</h2>
          <Field label="Company name"><input className="in" required value={form.companyName} onChange={update('companyName')} /></Field>
          <Field label="Recruiter name"><input className="in" required value={form.recruiterName} onChange={update('recruiterName')} /></Field>
          <Field label="Industry"><input className="in" value={form.industry} onChange={update('industry')} /></Field>
          <Field label="Company website">
            <input className="in" type="url" placeholder="Enter company website URL" value={form.website} onChange={update('website')} />
          </Field>
          <Field label="Location"><input className="in" value={form.location} onChange={update('location')} /></Field>
          <Field label="Contact information"><input className="in" value={form.contact} onChange={update('contact')} /></Field>
        </section>
      </div>
      <section className="card stack">
        <h2>Company description</h2>
        <Field label="Description"><textarea className="in" rows="5" value={form.description} onChange={update('description')} /></Field>
      </section>
      <section className="card stack">
        <h2>Notifications</h2>
        <p className="muted">Recruiter notification preference controls are not currently supported.</p>
      </section>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </form>
  );
}
