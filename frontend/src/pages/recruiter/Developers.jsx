import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { rankDevelopers } from '../../lib/matching.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';
import { SkillChips, scoreTone } from '../developer/Jobs.jsx';

export const DECISION = { shortlisted: ['warn', 'Shortlisted'], selected: ['ok', 'Selected'], rejected: ['err', 'Rejected'] };

export default function Developers() {
  const { profile } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState(null);
  const [devs, setDevs] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [skill, setSkill] = useState('all');
  const [min, setMin] = useState(0);

  const load = async () => {
    setJobs((await api.listRecruiterJobs(profile.id)).filter((j) => j.status === 'published'));
    setDevs((await api.listDevelopers()).filter((d) => d.status === 'active'));
    setDecisions(await api.listDecisions(profile.id));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  if (!jobs) return null;
  if (jobs.length === 0) {
    return (
      <div>
        <PageHead title="Recommended Developers" />
        <Empty>Publish a job to see recommended developers. <Link to="/recruiter/jobs">Manage Jobs</Link></Empty>
      </div>
    );
  }

  const job = jobs.find((j) => j.id === params.get('job')) || jobs[0];
  const jobSkills = [...job.requiredSkills, ...job.preferredSkills];
  const ranked = rankDevelopers(job, devs).filter(({ dev, result }) =>
    result.score >= min && (skill === 'all' || dev.skills.some((s) => s.toLowerCase() === skill.toLowerCase()))
  );
  const decisionOf = (devId) => decisions.find((d) => d.jobId === job.id && d.developerId === devId);

  const shortlist = async (dev) => {
    try {
      await api.shortlistCandidate(profile.id, job.id, dev.id);
      toast.success(`${dev.fullName} shortlisted.`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHead title="Recommended Developers" subtitle="Developers ranked by how well their verified skills match the job." />
      <div className="row">
        <label className="field" style={{ maxWidth: 360 }}>
          <span>Job</span>
          <select className="in" value={job.id} onChange={(e) => setParams({ job: e.target.value })}>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </label>
        <label className="field" style={{ maxWidth: 220 }}>
          <span>Skill</span>
          <select className="in" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="all">All skills</option>
            {jobSkills.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="field" style={{ maxWidth: 220 }}>
          <span>Minimum compatibility</span>
          <select className="in" value={min} onChange={(e) => setMin(Number(e.target.value))}>
            <option value={0}>Any</option><option value={50}>50% or more</option><option value={75}>75% or more</option>
          </select>
        </label>
      </div>
      <p className="muted small">Compatibility counts skills verified by GitHub fully and unverified skills at half. Ranking: highest compatibility first.</p>

      {ranked.length === 0 ? <Empty>No developers match this job and filter yet.</Empty> : (
        <div className="stack">
          {ranked.map(({ dev, result }, i) => {
            const d = decisionOf(dev.id);
            return (
              <article key={dev.id} className="card row" style={{ gap: 20, alignItems: 'center' }}>
                <b style={{ fontSize: 22, color: 'var(--indigo)', width: 36 }}>{i + 1}</b>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <b style={{ fontSize: 17 }}>{dev.fullName}</b>
                  <p className="muted">{dev.title || 'No professional title'}{dev.location && ` · ${dev.location}`}</p>
                  <div style={{ margin: '8px 0 4px' }}><SkillChips skills={dev.skills} dev={dev} /></div>
                  <Chip tone={scoreTone(result.score)}>Compatibility {result.score}% · {result.status}</Chip>
                  {d && <Chip tone={DECISION[d.status][0]}>{DECISION[d.status][1]}</Chip>}
                </div>
                <div className="row">
                  <Link className="btn ghost" to={`/recruiter/candidates/${dev.id}?job=${job.id}`}>View Candidate</Link>
                  <button className="btn" disabled={!!d} onClick={() => shortlist(dev)}>{d ? DECISION[d.status][1] : 'Shortlist'}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
