import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { verificationRows } from '../../lib/verify.js';
import { Chip, Empty, fmtDate } from '../../components/ui.jsx';

const BADGE = { verified: ['ok', '✓ Verified'], not_found: ['warn', '✗ Not found on GitHub'], not_analyzed: ['', 'Not analyzed'] };

export default function ViewProfile() {
  const { profile } = useAuth();
  const initials = profile.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const rows = verificationRows(profile);
  return (
    <div>
      <section className="card row" style={{ gap: 20, alignItems: 'center' }}>
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <h1>{profile.fullName}</h1>
          <p className="muted">{profile.title || 'No professional title yet'}{profile.location && ` · ${profile.location}`}</p>
          {profile.bio && <p style={{ marginTop: 8 }}>{profile.bio}</p>}
        </div>
        <Link className="btn" to="/developer/profile">Edit Profile</Link>
      </section>

      <div className="grid2" style={{ marginTop: 16 }}>
        <section className="card"><h2>Education</h2><p>{profile.education || <span className="muted">Not added.</span>}</p></section>
        <section className="card"><h2>Experience</h2><p>{profile.experience || <span className="muted">Not added.</span>}</p></section>
      </div>

      <section className="card">
        <h2>Skills</h2>
        {rows.length === 0 ? <Empty>No skills yet. <Link to="/developer/cv">Upload your CV</Link> or add skills in your profile.</Empty> : (
          <div className="chips">
            {rows.map((r) => (
              <Chip key={r.skill} tone={BADGE[r.status][0]}>
                {r.skill} · {profile.skillSources?.[r.skill] || 'Manual'} · {BADGE[r.status][1]}
              </Chip>
            ))}
          </div>
        )}
        <Link className="btn ghost" to="/developer/profile">Manage Skills</Link>
      </section>

      <div className="grid2" style={{ marginTop: 16 }}>
        <section className="card stack">
          <h2>GitHub</h2>
          {profile.github ? <p>Connected as <b>{profile.github.username}</b> · {profile.github.repos.length} repositories · pulled {fmtDate(profile.github.pulledAt)}</p> : <p className="muted">GitHub is not connected.</p>}
          <div><Link className="btn ghost" to="/developer/github">Manage GitHub</Link></div>
        </section>
        <section className="card stack">
          <h2>CV</h2>
          {profile.cv ? <p><b>{profile.cv.fileName}</b> · uploaded {fmtDate(profile.cv.uploadedAt)}</p> : <p className="muted">No CV uploaded.</p>}
          <div><Link className="btn ghost" to="/developer/cv">{profile.cv ? 'Upload new CV' : 'Upload CV'}</Link></div>
        </section>
      </div>
    </div>
  );
}
