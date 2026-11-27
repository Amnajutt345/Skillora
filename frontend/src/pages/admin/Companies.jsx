import { useEffect, useState } from 'react';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Confirm, Empty, Field, PageHead, fmtDate } from '../../components/ui.jsx';
import { STATUS } from '../recruiter/CompanyProfile.jsx';

const FIELDS = ['companyName', 'recruiterName', 'description', 'industry', 'website', 'contact', 'location'];
const LABELS = { companyName: 'Company name', recruiterName: 'Recruiter name', description: 'Description', industry: 'Industry', website: 'Website', contact: 'Contact', location: 'Location' };
const TABS = [['all', 'All Companies'], ['pending', 'Pending Approval'], ['approved', 'Approved'], ['needs_update', 'Update Required']];

function Details({ rec, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, rec[f] || ''])));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const act = async (fn, message) => {
    setError('');
    try {
      await fn();
      toast.success(message);
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <section className="card stack">
      <div className="row between">
        <h2>{rec.companyName}</h2>
        <Chip tone={STATUS[rec.approval.status][0]}>{STATUS[rec.approval.status][1]}</Chip>
      </div>
      <p className="muted">{rec.email}{rec.approval.submittedAt && ` · submitted ${fmtDate(rec.approval.submittedAt)}`}</p>
      {FIELDS.map((f) => (
        <Field key={f} label={LABELS[f]}>
          {f === 'description' ? <textarea className="in" rows="3" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} /> : <input className="in" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />}
        </Field>
      ))}
      <button className="btn ghost" onClick={() => act(() => api.updateRecruiter(rec.id, form), 'Company profile updated.')}>Save Changes</button>

      {rec.approval.status === 'pending' && (
        <div className="stack">
          <h2>Review</h2>
          <Field label="Feedback (required to request an update)"><textarea className="in" rows="2" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field>
          <div className="row">
            <button className="btn" onClick={() => act(() => api.reviewCompany(rec.id, 'approved'), 'Company approved.')}>Approve</button>
            <button className="btn ghost" onClick={() => act(() => api.reviewCompany(rec.id, 'needs_update', feedback), 'Update requested.')}>Request Update</button>
          </div>
        </div>
      )}
      {rec.approval.status === 'needs_update' && <div className="alert warn">Feedback sent: {rec.approval.feedback}</div>}
      {error && <div className="alert err" role="alert">{error}</div>}
    </section>
  );
}

export default function Companies() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => setRows(await api.listRecruiters());
  useEffect(() => { load(); }, []);

  const shown = rows.filter((r) => tab === 'all' || r.approval.status === tab);
  const selected = rows.find((r) => r.id === selectedId);

  return (
    <div>
      <PageHead title="Manage Companies" subtitle="Review recruiter and company profiles, approve them, or request an update." />
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="split">
        <section className="card">
          {shown.length === 0 ? <Empty>{rows.length === 0 ? 'No recruiters have registered yet.' : 'No companies in this view.'}</Empty> : (
            <div className="scroll">
              <table>
                <thead><tr><th>Company</th><th>Approval</th><th>Account</th><th>Action</th></tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className={r.id === selectedId ? 'sel' : ''}>
                      <td><b>{r.companyName}</b><div className="muted small">{r.recruiterName} · {r.email}</div></td>
                      <td><Chip tone={STATUS[r.approval.status][0]}>{STATUS[r.approval.status][1]}</Chip></td>
                      <td><Chip tone={r.status === 'active' ? 'ok' : 'err'}>{r.status === 'active' ? 'Active' : 'Inactive'}</Chip></td>
                      <td>
                        <div className="row">
                          <button className="btn ghost" onClick={() => setSelectedId(r.id)}>Review</button>
                          <button className="btn ghost" onClick={() => setConfirm(r)}>{r.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {selected ? <Details key={selected.id + selected.approval.status} rec={selected} onChanged={load} /> : <section className="card"><Empty>Select “Review” on a company to see its details.</Empty></section>}
      </div>

      {confirm && (
        <Confirm
          title={confirm.status === 'active' ? 'Deactivate company account' : 'Activate company account'}
          message={confirm.status === 'active' ? `${confirm.companyName} will no longer be able to log in.` : `${confirm.companyName} will be able to log in again.`}
          confirmLabel={confirm.status === 'active' ? 'Deactivate' : 'Activate'}
          danger={confirm.status === 'active'}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await api.setUserStatus(confirm.userId, confirm.status === 'active' ? 'inactive' : 'active');
            toast.success('Account status updated.');
            setConfirm(null);
            load();
          }}
        />
      )}
    </div>
  );
}
