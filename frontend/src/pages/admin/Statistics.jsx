import { useEffect, useState } from 'react';
import * as api from '../../api/api.js';
import { Empty, Field, PageHead, fmtDate } from '../../components/ui.jsx';

const SERIES = [
  ['developers', 'Developers'],
  ['recruiters', 'Companies'],
  ['jobs', 'Job posts'],
  ['applications', 'Applications'],
];

const Stat = ({ label, value }) => (
  <section className="card stat">
    <p className="muted">{label}</p>
    <h1>{value}</h1>
  </section>
);

export default function Statistics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  const loadStats = async (range = { from, to }) => {
    setError('');
    setBusy(true);
    try {
      const result = await api.getAdminStatistics(range);
      setStats(result);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { loadStats({ from: '', to: '' }); }, []);

  const filter = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setError('The start date must be on or before the end date.');
      return;
    }
    loadStats({ from, to });
  };

  const maxSkill = Math.max(1, ...(stats?.topSkills || []).map((skill) => skill.count));
  const maxActivity = Math.max(1, ...(stats?.activity || []).flatMap((month) => SERIES.map(([key]) => month[key])));

  return (
    <div>
      <PageHead title="Admin Statistics" subtitle="Counts and charts calculated from the data stored in this browser." />

      <form className="card row between statistics-filter" onSubmit={filter}>
        <div className="row">
          <Field label="From">
            <input className="in" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <input className="in" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
        </div>
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? 'Loading…' : 'Apply range'}</button>
          <button
            className="btn ghost"
            type="button"
            disabled={busy || (!from && !to)}
            onClick={() => {
              setFrom('');
              setTo('');
              loadStats({ from: '', to: '' });
            }}
          >
            All time
          </button>
        </div>
        <p className="muted small statistics-note">Date range filters account registrations, job creation, and applications. Skill and verification counts use developers registered in that range.</p>
      </form>

      {error && <div className="alert err" role="alert">{error}</div>}
      {busy && !stats && <div className="card"><p className="muted">Loading statistics…</p></div>}
      {stats && (
        <>
          <div className="grid4">
            <Stat label="Developers" value={stats.developers} />
            <Stat label="Recruiters / Companies" value={stats.recruiters} />
            <Stat label="Job posts" value={stats.jobs} />
            <Stat label="Applications" value={stats.applications} />
          </div>

          <div className="grid2">
            <section className="card">
              <h2>Most frequently claimed skills</h2>
              {stats.topSkills.length === 0 ? <Empty>No claimed skills are available for this date range.</Empty> : (
                <div className="bars">
                  {stats.topSkills.map((skill) => (
                    <div className="bar-row" key={skill.name}>
                      <span>{skill.name}</span>
                      <div className="bar"><i style={{ width: `${(skill.count / maxSkill) * 100}%` }} /></div>
                      <b>{skill.count}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card stack">
              <div>
                <h2>GitHub verification</h2>
                <p className="muted small">
                  {stats.connectedGithub} connected GitHub account{stats.connectedGithub === 1 ? '' : 's'} · {stats.analyzedDevelopers} developer{stats.analyzedDevelopers === 1 ? '' : 's'} analyzed
                </p>
              </div>
              {stats.claimedInAnalyzed === 0 ? <Empty>No analyzed developer skill evidence is available for this date range.</Empty> : (
                <>
                  <p>{stats.verified} of {stats.claimedInAnalyzed} analyzed claimed skills are verified.</p>
                  <div className="bars">
                    {[
                      ['Verified', stats.verified],
                      ['Not verified', stats.unverified],
                    ].map(([label, count]) => (
                      <div className="bar-row" key={label}>
                        <span>{label}</span>
                        <div className="bar"><i style={{ width: `${(count / stats.claimedInAnalyzed) * 100}%` }} /></div>
                        <b>{count}</b>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="card">
            <h2>Application activity by month</h2>
            <p className="muted small">Monthly totals for the latest 12 active months in the selected range.</p>
            {stats.activity.length === 0 ? <Empty>No dated registrations, job posts, or applications are available for this range.</Empty> : (
              <div className="activity-chart">
                {stats.activity.map((month) => (
                  <div className="activity-month" key={month.month}>
                    <b>{month.month}</b>
                    <div className="activity-series">
                      {SERIES.map(([key, label]) => (
                        <div className="activity-row" key={key}>
                          <span>{label}</span>
                          <div className="bar"><i style={{ width: `${(month[key] / maxActivity) * 100}%` }} /></div>
                          <b>{month[key]}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <p className="muted small" aria-live="polite">
            Last calculated: {updatedAt ? fmtDate(updatedAt) : '—'}. Data is read from this browser’s local storage; it updates when statistics are loaded.
          </p>
        </>
      )}
    </div>
  );
}
