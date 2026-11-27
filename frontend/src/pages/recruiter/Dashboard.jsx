import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { daysAgo, rankDevelopers } from '../../lib/matching.js';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';
import { STATUS } from './CompanyProfile.jsx';

const Stat = ({ label, value, hint }) => (
  <div className="card stat">
    <p className="muted">{label}</p>
    <h1>{value}</h1>
    {hint && <small className="muted">{hint}</small>}
  </div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [devs, setDevs] = useState([]);
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    api.listRecruiterJobs(profile.id).then(setJobs);
    api.listDevelopers().then((d) => setDevs(d.filter((x) => x.status === 'active')));
    api.listDecisions(profile.id).then(setDecisions);
  }, [profile.id]);

  const published = jobs.filter((j) => j.status === 'published');
  // best match per developer across the recruiter's published jobs
  const best = new Map();
  published.forEach((job) =>
    rankDevelopers(job, devs).forEach(({ dev, result }) => {
      if (!best.has(dev.id) || best.get(dev.id).result.score < result.score) best.set(dev.id, { dev, job, result });
    })
  );
  const recommended = [...best.values()].sort((a, b) => b.result.score - a.result.score);
  const status = profile.approval.status;

  return (
    <div>
      <PageHead title={`Welcome to Skillora, ${profile.recruiterName}`} subtitle="Company activity, job posts and recommended developers." />

      <section className="card stack">
        <div className="row between">
          <h2>Company approval</h2>
          <Chip tone={STATUS[status][0]}>{STATUS[status][1]}</Chip>
        </div>
        {status === 'approved' && <p className="muted">Your company is approved. You can publish jobs.</p>}
        {status === 'pending' && <p className="muted">An administrator is reviewing your company. You can create job drafts meanwhile.</p>}
        {status === 'draft' && <p className="muted">Complete your company profile and submit it for approval before publishing jobs.</p>}
        {status === 'needs_update' && <div className="alert err"><b>Update required.</b> {profile.approval.feedback}</div>}
        <div className="row">
          <Link className="btn ghost" to="/recruiter/profile">Manage Company Profile</Link>
          <Link className="btn" to="/recruiter/jobs/new">Create Job</Link>
        </div>
      </section>

      <div className="grid4">
        <Stat label="Total job posts" value={jobs.length} />
        <Stat label="Active job posts" value={published.length} />
        <Stat label="Recommended developers" value={recommended.length} hint="Share a skill with your published jobs" />
        <Stat label="Shortlisted candidates" value={decisions.filter((d) => d.status === 'shortlisted').length} hint="Waiting for your decision" />
      </div>

      <div className="grid2">
        <section className="card">
          <h2>Recent job posts</h2>
          {jobs.length === 0 ? <Empty>No job posts yet. <Link to="/recruiter/jobs/new">Create one</Link></Empty> : (
            <ul className="plain">
              {jobs.slice(0, 4).map((j) => (
                <li key={j.id} className="row between">
                  <div><b>{j.title}</b><div className="muted small">{j.status} · created {daysAgo(j.createdAt)}</div></div>
                  <Link className="btn ghost" to="/recruiter/jobs">View</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Recommended developers</h2>
          {recommended.length === 0 ? <Empty>{published.length === 0 ? 'Publish a job to see matching developers.' : 'No developers match your jobs yet.'}</Empty> : (
            <ul className="plain">
              {recommended.slice(0, 3).map(({ dev, job, result }) => (
                <li key={dev.id} className="row between">
                  <div><b>{dev.fullName}</b><div className="muted small">{result.score}% for {job.title}</div></div>
                  <Link className="btn ghost" to={`/recruiter/candidates/${dev.id}?job=${job.id}`}>View Profile</Link>
                </li>
              ))}
            </ul>
          )}
          <Link className="btn ghost" to="/recruiter/developers">View all developers</Link>
        </section>
      </div>
    </div>
  );
}
