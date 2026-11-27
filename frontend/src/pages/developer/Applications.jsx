import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { Chip, Empty, PageHead, fmtDate } from '../../components/ui.jsx';

const STATUS = { applied: ['', 'Applied'], shortlisted: ['warn', 'Shortlisted'], selected: ['ok', 'Selected'], rejected: ['err', 'Rejected'] };

export default function Applications() {
  const { profile } = useAuth();
  const [apps, setApps] = useState(null);
  useEffect(() => { api.listApplications(profile.id).then(setApps); }, [profile.id]);
  if (!apps) return null;
  return (
    <div>
      <PageHead title="My Applications" subtitle="Jobs you have applied for.">
        <Link className="btn ghost" to="/developer/notifications">View Notifications</Link>
      </PageHead>
      <section className="card">
        {apps.length === 0 ? <Empty>No applications yet. <Link to="/developer/jobs">Browse jobs</Link></Empty> : (
          <div className="scroll">
            <table>
              <thead><tr><th>Job</th><th>Company</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.job?.title || 'Job removed'}</b></td>
                    <td>{a.job?.companyName}</td>
                    <td>{fmtDate(a.appliedAt)}</td>
<td>
  <Chip tone={STATUS[a.status]?.[0] || ''}>
    {STATUS[a.status]?.[1] || a.status || 'Unknown'}
  </Chip>
</td>                    <td>
                      {a.job && (
                        <div className="row">
                          <Link className="btn ghost" to={`/developer/jobs/${a.jobId}`}>View Job</Link>
                          <Link className="btn ghost" to={`/developer/skill-recommendations?job=${a.jobId}`}>Skill Recommendations</Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="muted small">Selected and Rejected results arrive as notifications from the recruiter.</p>
    </div>
  );
}
