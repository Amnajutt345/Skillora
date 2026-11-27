import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { evaluate } from '../../lib/matching.js';
import { EVIDENCE_LABEL, verificationRows } from '../../lib/verify.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Confirm, Empty, PageHead, fmtDate } from '../../components/ui.jsx';
import { scoreTone } from '../developer/Jobs.jsx';
import { DECISION } from './Developers.jsx';

const BADGE = { verified: ['ok', '✓ Verified'], not_found: ['warn', '✗ Not found on GitHub'], not_analyzed: ['', 'Not analyzed'] };

export default function Candidate() {
  const { devId } = useParams();
  const [params, setParams] = useSearchParams();
  const { profile } = useAuth();
  const toast = useToast();
  const [dev, setDev] = useState(undefined);
  const [jobs, setJobs] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [ask, setAsk] = useState(null);

  const load = async () => {
    setDev((await api.listDevelopers()).find((d) => d.id === devId && d.status === 'active') || null);
    setJobs((await api.listRecruiterJobs(profile.id)).filter((j) => j.status === 'published'));
    setDecisions(await api.listDecisions(profile.id));
  };
  useEffect(() => { load(); }, [devId]); // eslint-disable-line

  if (dev === undefined) return null;
  if (!dev) return <Empty>This developer is not available. <Link to="/recruiter/developers">Back to recommendations</Link></Empty>;

  const job = jobs.find((j) => j.id === params.get('job')) || jobs[0];
  const result = job ? evaluate(job, dev) : null;
  const decision = job && decisions.find((d) => d.jobId === job.id && d.developerId === dev.id);
  const rows = verificationRows(dev);
  const verified = rows.filter((r) => r.status === 'verified');

  const act = async (fn, message) => {
    try {
      await fn();
      toast.success(message);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHead title={dev.fullName} subtitle={`${dev.title || 'No professional title'}${dev.location ? ` · ${dev.location}` : ''}`}>
        <Link className="btn ghost" to={job ? `/recruiter/developers?job=${job.id}` : '/recruiter/developers'}>Return to Recommendations</Link>
      </PageHead>

      <section className="card stack">
        <h2>Profile</h2>
        {dev.bio && <p>{dev.bio}</p>}
        <p><b>Email:</b> {dev.email}{dev.contact && <> · <b>Contact:</b> {dev.contact}</>}</p>
        <p><b>Education:</b> {dev.education || '—'} · <b>Experience:</b> {dev.experience || '—'}</p>
      </section>

      <section className="card stack">
        <h2>Skill Sheet</h2>
        {rows.length === 0 ? <span className="muted">No skills on the profile.</span> : (
          <div className="chips">{rows.map((r) => <Chip key={r.skill} tone={BADGE[r.status][0]}>{r.skill} · {dev.skillSources?.[r.skill] || 'Manual'} · {BADGE[r.status][1]}</Chip>)}</div>
        )}
      </section>

      <section className="card stack">
        <h2>GitHub evidence</h2>
        {!dev.github ? <p className="muted">This developer has not connected GitHub.</p> : (
          <p>GitHub: <a href={`https://github.com/${dev.github.username}`} target="_blank" rel="noreferrer">{dev.github.username}</a> · {dev.github.repos.length} repositories · pulled {fmtDate(dev.github.pulledAt)}</p>
        )}
        {verified.length > 0 && (
          <table>
            <thead><tr><th>Skill</th><th>Evidence</th></tr></thead>
            <tbody>
              {verified.map((r) => (
                <tr key={r.skill}>
                  <td><b>{r.skill}</b></td>
                  <td>{r.evidence.slice(0, 4).map((e, i) => <div key={i} className="small"><Chip>{EVIDENCE_LABEL[e.type]}</Chip> {e.repo} — {e.detail}</div>)}{r.evidence.length > 4 && <div className="muted small">+ {r.evidence.length - 4} more</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {dev.github && verified.length === 0 && <p className="muted">No claimed skill is verified by the analyzed repositories yet.</p>}
      </section>

      {!job ? <Empty>Publish a job to see compatibility and shortlist this candidate.</Empty> : (
        <section className="card stack">
          <div className="row between">
            <h2>Compatibility</h2>
            <label className="field" style={{ maxWidth: 320 }}>
              <span>Job</span>
              <select className="in" value={job.id} onChange={(e) => setParams({ job: e.target.value })}>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
            </label>
          </div>
          <div><Chip tone={scoreTone(result.score)}>{result.score}% · {result.status}</Chip></div>
          <div className="grid3">
            <div><p className="label">✓ Matching skills</p>{result.strong.length ? result.strong.map((s) => <Chip key={s.skill} tone="ok">{s.skill}</Chip>) : <span className="muted">None verified.</span>}</div>
            <div><p className="label">~ Claimed, not verified</p>{result.weak.filter((w) => w.reason === 'unverified').map((s) => <Chip key={s.skill} tone="warn">{s.skill}</Chip>)}</div>
            <div><p className="label">✗ Missing skills</p>{result.weak.filter((w) => w.reason === 'missing').map((s) => <Chip key={s.skill} tone="err">{s.skill} ({s.kind})</Chip>)}</div>
          </div>

          <div className="row">
            {!decision && <button className="btn" onClick={() => act(() => api.shortlistCandidate(profile.id, job.id, dev.id), `${dev.fullName} shortlisted.`)}>Shortlist Candidate</button>}
            {decision && <Chip tone={DECISION[decision.status][0]}>{DECISION[decision.status][1]}</Chip>}
            {decision?.status === 'shortlisted' && (
              <>
                <button className="btn" onClick={() => setAsk('selected')}>Select and notify</button>
                <button className="btn ghost" onClick={() => setAsk('rejected')}>Reject and notify</button>
              </>
            )}
            {decision && decision.status !== 'shortlisted' && <span className="muted">Notification sent {fmtDate(decision.decidedAt)}.</span>}
          </div>
        </section>
      )}

      {ask && (
        <Confirm
          title={ask === 'selected' ? 'Select candidate' : 'Reject candidate'}
          message={`${dev.fullName} will be notified that they were ${ask === 'selected' ? 'selected' : 'not selected'} for ${job.title}. This cannot be undone.`}
          confirmLabel={ask === 'selected' ? 'Select and notify' : 'Reject and notify'}
          danger={ask === 'rejected'}
          onCancel={() => setAsk(null)}
          onConfirm={() => { const d = ask; setAsk(null); act(() => api.decideCandidate(profile.id, job.id, dev.id, d), d === 'selected' ? 'Candidate selected. Notification sent.' : 'Candidate rejected. Notification sent.'); }}
        />
      )}
    </div>
  );
}
