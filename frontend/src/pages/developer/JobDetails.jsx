import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { daysAgo, evaluate } from '../../lib/matching.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';
import { SkillChips, scoreTone } from './Jobs.jsx';

export default function JobDetails() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const load = async () => {
    try {
      setJob(await api.getJob(id));
      setApplied((await api.listApplications(profile.id)).some((a) => a.jobId === id));
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const apply = async () => {
    try {
      await api.applyForJob(profile.id, id);
      toast.success('Application submitted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (error) return <Empty>{error} <Link to="/developer/jobs">Back to Jobs</Link></Empty>;
  if (!job) return null;
  const r = evaluate(job, profile);
  const matched = r.strong;
  const unverified = r.weak.filter((w) => w.reason === 'unverified');
  const missing = r.weak.filter((w) => w.reason === 'missing');

  return (
    <div>
      <PageHead title={job.title} subtitle={`${job.companyName}${job.location ? ` · ${job.location}` : ''} · posted ${daysAgo(job.postedAt)}`}>
        {applied ? <Chip tone="ok">✓ Applied</Chip> : <button className="btn" onClick={apply}>Apply for Job</button>}
      </PageHead>

      <section className="card stack">
        <h2>Description</h2><p>{job.description}</p>
        {job.responsibilities && <><h2>Responsibilities</h2><p>{job.responsibilities}</p></>}
        {job.experience && <p><b>Experience:</b> {job.experience}</p>}
      </section>

      <div className="grid2">
        <section className="card"><h2>Required skills</h2><SkillChips skills={job.requiredSkills} dev={profile} /></section>
        <section className="card"><h2>Preferred skills</h2>{job.preferredSkills.length ? <SkillChips skills={job.preferredSkills} dev={profile} /> : <span className="muted">None listed.</span>}</section>
      </div>

      <section className="card stack">
        <h2>Compatibility</h2>
        <div><Chip tone={scoreTone(r.score)}>{r.score}% · {r.status}</Chip></div>
        <div className="grid3">
          <div><p className="label">✓ Matched skills (verified on GitHub)</p>{matched.length ? matched.map((m) => <Chip key={m.skill} tone="ok">{m.skill}</Chip>) : <span className="muted">None yet.</span>}</div>
          <div><p className="label">~ On your profile, not verified</p>{unverified.length ? unverified.map((m) => <Chip key={m.skill} tone="warn">{m.skill}</Chip>) : <span className="muted">None.</span>}</div>
          <div><p className="label">✗ Missing skills</p>{missing.length ? missing.map((m) => <Chip key={m.skill} tone="err">{m.skill} ({m.kind})</Chip>) : <span className="muted">None.</span>}</div>
        </div>
      </section>

      <div className="row">
        <Link className="btn ghost" to={`/developer/skill-recommendations?job=${job.id}`}>View Skill Recommendations</Link>
        <Link className="btn ghost" to="/developer/jobs">Back to Jobs</Link>
      </div>
    </div>
  );
}
