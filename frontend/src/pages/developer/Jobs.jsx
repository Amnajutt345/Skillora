import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { daysAgo, rank } from '../../lib/matching.js';
import { verificationRows } from '../../lib/verify.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';

export const scoreTone = (s) => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : '');

export function SkillChips({ skills, dev }) {
  const rows = new Map(verificationRows(dev).map((r) => [r.skill.toLowerCase(), r.status]));
  return skills.map((s) => {
    const st = rows.get(s.toLowerCase());
    return <Chip key={s} tone={st === 'verified' ? 'ok' : st ? 'warn' : ''}>{st === 'verified' ? '✓ ' : st ? '~ ' : ''}{s}</Chip>;
  });
}

export default function Jobs() {
  const { profile } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState(null);
  const [applied, setApplied] = useState(new Set());
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('all');
  const [skill, setSkill] = useState('all');
  const [recent, setRecent] = useState(false);
  const [onlyMatching, setOnlyMatching] = useState(true);

  const load = async () => {
    setJobs(await api.listJobs());
    setApplied(new Set((await api.listApplications(profile.id)).map((a) => a.jobId)));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const ranked = useMemo(() => (jobs ? rank(jobs, profile, onlyMatching) : []), [jobs, profile, onlyMatching]);
  const locations = [...new Set((jobs || []).map((j) => j.location).filter(Boolean))];
  const skills = [...new Set((jobs || []).flatMap((j) => [...j.requiredSkills, ...j.preferredSkills]))].sort();
  const shown = ranked.filter(({ job }) =>
    (location === 'all' || job.location === location) &&
    (skill === 'all' || [...job.requiredSkills, ...job.preferredSkills].includes(skill)) &&
    (!recent || Date.now() - new Date(job.postedAt) <= 30 * 86400000) &&
    `${job.title} ${job.companyName}`.toLowerCase().includes(q.toLowerCase())
  );

  const apply = async (job) => {
    try {
      await api.applyForJob(profile.id, job.id);
      toast.success(`Applied for ${job.title}.`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!jobs) return null;
  return (
    <div>
      <PageHead title="Recommended Jobs" subtitle="Jobs ranked by how well they match your Skill Sheet." />
      <div className="row">
        <input className="in" style={{ width: 280 }} aria-label="Search jobs" placeholder="Search by job title or company" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="in" aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="all">Location: All</option>
          {locations.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select className="in" aria-label="Skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="all">Skill: All</option>
          {skills.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} /> Recent jobs (last 30 days)</label>
        <label className="check"><input type="checkbox" checked={onlyMatching} onChange={(e) => setOnlyMatching(e.target.checked)} /> Only jobs matching my skills</label>
      </div>
      <p className="muted small">Compatibility is calculated from your verified skills. ✓ verified on GitHub · ~ on your profile but not verified.</p>

      {shown.length === 0 ? (
        <Empty>
          {jobs.length === 0 ? 'No jobs have been published yet.' : profile.skills.length === 0 && onlyMatching ? <>Add skills first so jobs can be matched. <Link to="/developer/cv">Upload your CV</Link></> : 'No jobs match these filters.'}
        </Empty>
      ) : (
        <div className="grid2">
          {shown.map(({ job, result }) => (
            <article key={job.id} className="card stack">
              <div>
                <b style={{ fontSize: 17 }}>{job.title}</b>
                <p className="muted">{job.companyName}{job.location && ` · ${job.location}`} · posted {daysAgo(job.postedAt)}</p>
              </div>
              <p>{job.description}</p>
              <div><p className="small muted">Required</p><SkillChips skills={job.requiredSkills} dev={profile} /></div>
              {job.preferredSkills.length > 0 && <div><p className="small muted">Preferred</p><SkillChips skills={job.preferredSkills} dev={profile} /></div>}
              <div><Chip tone={scoreTone(result.score)}>Compatibility {result.score}% · {result.status}</Chip></div>
              <div className="row">
                <Link className="btn ghost" to={`/developer/jobs/${job.id}`}>View Details</Link>
                {applied.has(job.id) ? <Chip tone="ok">✓ Applied</Chip> : <button className="btn" onClick={() => apply(job)}>Apply for Job</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
