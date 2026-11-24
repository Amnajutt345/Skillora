import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Field, PageHead, fmtDate } from '../../components/ui.jsx';

const FIELDS = ['recruiterName', 'companyName', 'description', 'industry', 'website', 'contact', 'location'];
export const STATUS = {
  draft: ['', 'Not submitted'],
  pending: ['warn', 'Pending review'],
  approved: ['ok', 'Approved'],
  needs_update: ['err', 'Update required'],
};

export default function CompanyProfile() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, profile[f] || ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const status = profile.approval.status;
  const canSubmit = status === 'draft' || status === 'needs_update';

  const save = async () => {
    await api.updateRecruiter(profile.id, form);
    refresh();
  };

  const run = async (fn, message) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      refresh();
      toast.success(message);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div>
      <PageHead title="Manage Company Profile" subtitle="Keep your company details up to date. An administrator reviews them before approval.">
        <Chip tone={STATUS[status][0]}>{STATUS[status][1]}</Chip>
      </PageHead>

      {status === 'needs_update' && (
        <div className="alert err">
          <b>Update required.</b> {profile.approval.feedback}
        </div>
      )}
      {status === 'pending' && <div className="alert info">Submitted {fmtDate(profile.approval.submittedAt)}. Waiting for an administrator to review your company.</div>}
      {status === 'approved' && <div className="alert ok">Your company is approved.</div>}

      <div className="grid2">
        <section className="card stack">
          <h2>Company information</h2>
          <Field label="Company name"><input className="in" value={form.companyName} onChange={set('companyName')} /></Field>
          <Field label="Company description"><textarea className="in" rows="5" value={form.description} onChange={set('description')} /></Field>
          <Field label="Industry"><input className="in" value={form.industry} onChange={set('industry')} /></Field>
          <Field label="Website"><input className="in" value={form.website} onChange={set('website')} placeholder="https://" /></Field>
        </section>
        <section className="card stack">
          <h2>Recruiter and contact</h2>
          <Field label="Recruiter name"><input className="in" value={form.recruiterName} onChange={set('recruiterName')} /></Field>
          <Field label="Contact information"><input className="in" value={form.contact} onChange={set('contact')} /></Field>
          <Field label="Location"><input className="in" value={form.location} onChange={set('location')} /></Field>
        </section>
      </div>

      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn" disabled={busy} onClick={() => run(save, 'Company profile saved.')}>Save Profile</button>
        {canSubmit && (
          <button
            className="btn ghost"
            disabled={busy}
            onClick={() => run(async () => { await save(); await api.submitCompany(profile.id); }, 'Submitted for approval.')}
          >
            {status === 'needs_update' ? 'Update and Resubmit' : 'Submit for Approval'}
          </button>
        )}
      </div>
    </div>
  );
}
