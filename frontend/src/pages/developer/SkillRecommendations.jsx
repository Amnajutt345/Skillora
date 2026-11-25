import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { evaluate, recommendation } from '../../lib/matching.js';
import { syncGithub } from '../../lib/sync.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';
import { scoreTone } from './Jobs.jsx';

export default function SkillRecommendations() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listApplications(profile.id).then((a) => setApps(a.filter((x) => x.job)));
  }, [profile.id]);

  if (!apps) return null;
  const selectedId = params.get('job') || '';
  const app = apps.find((a) => a.jobId === selectedId);
  const result = app ? evaluate(app.job, profile) : null;
  const before = result?.score;

  const sync = async () => {
    setError('');
    setProgress({ done: 0, total: 1 });
    try {
      await syncGithub(profile, (done, total) => setProgress({ done, total }));
      refresh();
      toast.success('GitHub synced. Your Skill Sheet and compatibility score were recalculated.');
    } catch (e) {
      setError(e.message);
    }
    setProgress(null);
  };

  return (
    <div>
      <PageHead title="Improve Your Skills" subtitle="Pick a job you applied for to see how you match and what to work on." />
      {apps.length === 0 ? (
        <Empty>You have not applied for any job yet. <Link to="/developer/jobs">Browse jobs</Link></Empty>
      ) : (
        <section className="card stack">
          <label className="field" style={{ maxWidth: 420 }}>
            <span>Applied job</span>
            <select className="in" value={selectedId} onChange={(e) => setParams(e.target.value ? { job: e.target.value } : {})}>
              <option value="">Select a job…</option>
              {apps.map((a) => <option key={a.id} value={a.jobId}>{a.job.title} — {a.job.companyName}</option>)}
            </select>
          </label>
        </section>
      )}

      {result && (
        <>
          <section className="card stack">
            <div className="row between">
              <div><h2>{app.job.title}</h2><p className="muted">{app.job.companyName}</p></div>
              <Chip tone={scoreTone(result.score)}>Compatibility {result.score}% · {result.status}</Chip>
            </div>
            <div className="grid2">
              <div>
                <h2>Strong matches</h2>
                {result.strong.length ? result.strong.map((s) => <Chip key={s.skill} tone="ok">✓ {s.skill}</Chip>) : <span className="muted">No verified matches yet.</span>}
              </div>
              <div>
                <h2>Weak matches</h2>
                {result.weak.length ? result.weak.map((s) => <Chip key={s.skill} tone={s.reason === 'missing' ? 'err' : 'warn'}>{s.skill}</Chip>) : <span className="muted">None. Nice work.</span>}
              </div>
            </div>
          </section>

          <section className="card stack">
            <h2>Recommendations</h2>
            {result.weak.length === 0 ? <p className="muted">Every skill for this job is verified on GitHub.</p> : (
              <ul className="plain">
                {[...result.weak].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'required' ? -1 : 1)).map((w) => (
                  <li key={w.skill} className="reco">
                    <b>{w.skill}</b> <Chip tone={w.kind === 'required' ? 'err' : ''}>{w.kind}</Chip> <Chip tone={w.reason === 'missing' ? 'err' : 'warn'}>{w.reason === 'missing' ? 'missing' : 'not verified'}</Chip>
                    <p>{recommendation(w)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card stack">
            <h2>Worked on it?</h2>
            <p className="muted">Add the work to GitHub, then sync. Skillora pulls your repositories again, re-analyzes them, updates your Skill Sheet and recalculates this score.</p>
            {profile.github ? (
              <div className="row">
                <button className="btn" onClick={sync} disabled={!!progress}>{progress ? `Analyzing ${progress.done}/${progress.total}…` : 'Sync GitHub'}</button>
                <Link className="btn ghost" to="/developer/profile">Update Skill Sheet</Link>
              </div>
            ) : (
              <p>GitHub is not connected. <Link to="/developer/github">Connect GitHub</Link></p>
            )}
            {error && <div className="alert err" role="alert">{error}</div>}
            <p className="small muted" data-testid="score-note">Current score: {before}%</p>
          </section>
        </>
      )}
    </div>
  );
}
