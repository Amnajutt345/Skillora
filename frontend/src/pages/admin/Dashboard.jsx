import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../api/api.js';
import { Empty, PageHead } from '../../components/ui.jsx';

const Stat = ({ label, value, hint }) => (
  <div className="card stat">
    <p className="muted">{label}</p>
    <h1>{value}</h1>
    {hint && <small className="muted">{hint}</small>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    api.getStats().then(setStats);
    api.listRecruiters().then((r) => setPending(r.filter((x) => x.approval.status === 'pending')));
  }, []);

  if (!stats) return null;
  const max = Math.max(1, ...stats.topSkills.map((s) => s.count));
  return (
    <div>
      <PageHead title="Admin Dashboard" subtitle="Overview of the Skillora platform." />
      <div className="grid4">
        <Stat label="Developers" value={stats.developers} hint={`${stats.connectedGithub} with GitHub connected`} />
        <Stat label="Companies" value={stats.recruiters} hint={`${stats.approvals.approved} approved`} />
        <Stat label="Skills in catalogue" value={stats.skills} />
        <Stat label="Pending approvals" value={stats.approvals.pending} hint={`${stats.approvals.needs_update} awaiting an update`} />
      </div>

      <div className="grid2">
        <section className="card">
          <h2>Pending company reviews</h2>
          {pending.length === 0 ? <Empty>No companies are waiting for review.</Empty> : (
            <ul className="plain">
              {pending.map((r) => <li key={r.id}><b>{r.companyName}</b> <span className="muted">· {r.recruiterName}</span></li>)}
            </ul>
          )}
          <Link className="btn ghost" to="/admin/companies">Manage Companies</Link>
        </section>

        <section className="card">
          <h2>GitHub verification</h2>
          {stats.claimedInAnalyzed === 0 ? (
            <Empty>No developer has run the GitHub analysis yet.</Empty>
          ) : (
            <p>
              <b>{stats.verified}</b> of <b>{stats.claimedInAnalyzed}</b> claimed skills are verified by GitHub evidence, across {stats.analyzedDevelopers} analyzed developer{stats.analyzedDevelopers > 1 ? 's' : ''}.
            </p>
          )}
          <Link className="btn ghost" to="/admin/developers">Manage Developers</Link>
        </section>
      </div>

      <section className="card">
        <h2>Most claimed skills</h2>
        {stats.topSkills.length === 0 ? <Empty>No developer has added skills yet.</Empty> : (
          <div className="bars">
            {stats.topSkills.map((s) => (
              <div key={s.name} className="bar-row">
                <span>{s.name}</span>
                <div className="bar"><i style={{ width: `${(s.count / max) * 100}%` }} /></div>
                <b>{s.count}</b>
              </div>
            ))}
          </div>
        )}
        <Link className="btn ghost" to="/admin/skills">Manage Skills</Link>
      </section>
    </div>
  );
}
