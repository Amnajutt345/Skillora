import { Link, Navigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  ['CV Skill Extraction', 'Upload your CV and review the skills extracted from it.'],
  ['GitHub Skill Analysis', 'Pull your repositories and see which skills your code backs up.'],
  ['Skill-Based Job Recommendations', 'Explore jobs ranked by how well they match your skills.'],
  ['Developer Talent Matching', 'Recruiters see developers recommended for each job.'],
  ['Job Requirement Analysis', 'Define requirements and review how they map to skills.'],
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return (
    <div className="landing">
      <header className="topbar landing-nav">
        <b className="brand dark">Skillora</b>
        <nav className="row" style={{ alignItems: 'center', gap: 20 }} aria-label="Main">
          <a href="#features">Features</a>
          <Link className="btn ghost" to="/login">Login</Link>
          <Link className="btn" to="/register">Get Started</Link>
        </nav>
      </header>
      <section className="hero">
        <div>
          <h1>Build Your Skills. Discover Your Opportunities.</h1>
          <p className="lead">Skillora connects developers and recruiters through skill-based analysis, GitHub evidence and job matching.</p>
          <div className="row"><Link className="btn" to="/register">Get Started</Link><Link className="btn ghost" to="/login">Login</Link></div>
        </div>
      </section>
      <section id="features" className="band">
        <h1>Features</h1>
        <div className="grid5">{FEATURES.map(([t, d]) => <div key={t} className="card"><h2>{t}</h2><p className="muted">{d}</p></div>)}</div>
      </section>
      <section className="band">
        <h1>How it works</h1>
        <div className="grid2">
          <div className="card"><h2>Developer</h2><ol><li>Create profile.</li><li>Upload CV.</li><li>Connect GitHub.</li><li>Explore job recommendations.</li></ol></div>
          <div className="card"><h2>Recruiter</h2><ol><li>Create company profile.</li><li>Publish a job.</li><li>Review recommended developers.</li><li>Shortlist candidates.</li></ol></div>
        </div>
      </section>
      <footer className="landing-foot"><span>About Skillora</span><span><Link to="/login">Login</Link> · <Link to="/register">Register</Link> · <Link to="/admin/login">Admin</Link></span></footer>
    </div>
  );
}
