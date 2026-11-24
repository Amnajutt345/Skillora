import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { rank, daysAgo } from '../../lib/matching.js';
import { profileCompletion } from '../../lib/profile.js';
import { Chip, Empty, PageHead, fmtDate } from '../../components/ui.jsx';

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
  const [apps, setApps] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.listJobs().then(setJobs);
    api.listApplications(profile.id).then(setApps);
    api.listNotifications(profile.id).then(setNotes);
  }, [profile.id]);

  const recommended = rank(jobs, profile);
  const unread = notes.filter((n) => !n.read).length;
  const gh = profile.github;

  return (
    <div>
      <PageHead title={`Welcome back, ${profile.fullName}`} subtitle="An overview of your profile, skills and job opportunities." />
      <div className="grid4">
        <Stat label="Profile completion" value={`${profileCompletion(profile)}%`} />
        <Stat label="Total skills" value={profile.skills.length} />
        <Stat label="GitHub" value={gh ? 'Connected' : 'Not connected'} hint={gh ? `${gh.repos.length} repositories` : undefined} />
        <Stat label="Job recommendations" value={recommended.length} hint="Jobs that share a skill with you" />
      </div>

      <div className="grid2">
        <section className="card stack">
          <h2>Skills overview</h2>
          {profile.skills.length === 0 ? <Empty>No skills yet. Upload your CV or add skills.</Empty> : <div className="chips">{profile.skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>}
          <div className="row">
            <Link className="btn ghost" to="/developer/analysis">View Skill Sheet</Link>
            <Link className="btn ghost" to="/developer/cv">Upload CV</Link>
          </div>
        </section>
        <section className="card stack">
          <h2>GitHub</h2>
          {gh ? <p>Connected as <b>{gh.username}</b>. Last pulled {fmtDate(gh.pulledAt)}.</p> : <p className="muted">Connect GitHub so Skillora can verify your skills with real repositories.</p>}
          <div><Link className="btn" to="/developer/github">{gh ? 'View repositories' : 'Connect GitHub'}</Link></div>
        </section>
      </div>

      <section className="card">
        <div className="row between"><h2>Recommended jobs</h2><Link to="/developer/jobs">See all</Link></div>
        {recommended.length === 0 ? <Empty>No jobs match your skills yet.</Empty> : (
          <ul className="plain">
            {recommended.slice(0, 3).map(({ job, result }) => (
              <li key={job.id} className="row between">
                <div><b>{job.title}</b><div className="muted small">{job.companyName} · posted {daysAgo(job.postedAt)}</div></div>
                <div className="row"><Chip tone={result.score >= 75 ? 'ok' : result.score >= 50 ? 'warn' : ''}>{result.score}% · {result.status}</Chip><Link className="btn ghost" to={`/developer/jobs/${job.id}`}>View Details</Link></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Recent activity</h2>
        {apps.length === 0 && notes.length === 0 ? <Empty>No applications or notifications yet.</Empty> : (
          <ul className="plain">
            {apps.slice(0, 3).map((a) => <li key={a.id}>Applied for <b>{a.job?.title || 'a job'}</b> <span className="muted">· {fmtDate(a.appliedAt)}</span></li>)}
            {notes.slice(0, 3).map((n) => <li key={n.id}>{n.message} <span className="muted">· {fmtDate(n.sentAt)}</span></li>)}
          </ul>
        )}
        <Link className="btn ghost" to="/developer/notifications">Notifications{unread ? ` (${unread} new)` : ''}</Link>
      </section>
    </div>
  );
}
