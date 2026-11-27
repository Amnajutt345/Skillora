import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Confirm, Empty, PageHead, fmtDate } from '../../components/ui.jsx';

const TABS = [['all', 'All Jobs'], ['published', 'Published Jobs'], ['draft', 'Draft Jobs'], ['closed', 'Closed Jobs']];
const TONE = { published: 'ok', draft: 'warn', closed: '' };

export default function Jobs() {
  const { profile } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState('all');
  const [ask, setAsk] = useState(null); // { kind: 'close' | 'delete', job }

  const load = async () => setJobs(await api.listRecruiterJobs(profile.id));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const run = async (fn, message) => {
    try {
      await fn();
      toast.success(message);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!jobs) return null;
  const shown = jobs.filter((j) => tab === 'all' || j.status === tab);
  return (
    <div>
      <PageHead title="Manage Jobs" subtitle="Your job posts.">
        <Link className="btn" to="/recruiter/jobs/new">Create New Job</Link>
      </PageHead>
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <section className="card">
        {shown.length === 0 ? <Empty>{jobs.length === 0 ? <>No job posts yet. <Link to="/recruiter/jobs/new">Create your first job</Link></> : 'No jobs in this view.'}</Empty> : (
          <div className="scroll">
            <table>
              <thead><tr><th>Job</th><th>Created</th><th>Status</th><th>Required skills</th><th>Applicants</th><th>Action</th></tr></thead>
              <tbody>
                {shown.map((j) => (
                  <tr key={j.id}>
                    <td><b>{j.title}</b><div className="muted small">{j.location || '—'}</div></td>
                    <td>{fmtDate(j.createdAt)}</td>
                    <td>
                      <Chip tone={TONE[j.status]}>{j.status[0].toUpperCase() + j.status.slice(1)}</Chip>
                      {j.status === 'draft' && !j.confirmed && <div className="muted small">Requirements not confirmed</div>}
                    </td>
                    <td>{j.requiredSkills.map((s) => <Chip key={s}>{s}</Chip>)}</td>
                    <td>{j.applicants}</td>
                    <td>
                      <div className="row">
                        <button className="btn ghost" onClick={() => nav(`/recruiter/jobs/${j.id}/edit`)}>Edit</button>
                        {j.status !== 'published' && !j.confirmed && <button className="btn ghost" onClick={() => nav(`/recruiter/jobs/${j.id}/requirements`)}>Review requirements</button>}
                        {j.status !== 'published' && j.confirmed && <button className="btn" onClick={() => run(() => api.setJobStatus(profile.id, j.id, 'published'), 'Job published.')}>Publish</button>}
                        {j.status === 'published' && <button className="btn ghost" onClick={() => nav(`/recruiter/developers?job=${j.id}`)}>View Developers</button>}
                        {j.status === 'published' && <button className="btn ghost" onClick={() => setAsk({ kind: 'close', job: j })}>Close</button>}
                        {j.status !== 'published' && <button className="btn ghost" onClick={() => setAsk({ kind: 'delete', job: j })}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ask && (
        <Confirm
          title={ask.kind === 'close' ? 'Close job' : 'Delete job'}
          message={ask.kind === 'close' ? `${ask.job.title} will no longer be visible to developers.` : `${ask.job.title} and its applications and shortlist will be deleted.`}
          confirmLabel={ask.kind === 'close' ? 'Close job' : 'Delete'}
          danger
          onCancel={() => setAsk(null)}
          onConfirm={async () => {
            const { kind, job } = ask;
            setAsk(null);
            await run(() => (kind === 'close' ? api.setJobStatus(profile.id, job.id, 'closed') : api.deleteJob(profile.id, job.id)), kind === 'close' ? 'Job closed.' : 'Job deleted.');
          }}
        />
      )}
    </div>
  );
}
