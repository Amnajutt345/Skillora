import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';

export default function Register() {
  const { user, signUp } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', companyName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!role) {
    return (
      <div className="auth-page">
        <div className="card auth-card wide">
          <b className="brand dark">Skillora</b>
          <h1>Join Skillora</h1>
          <p className="muted">Select how you want to use Skillora.</p>
          <div className="grid2">
            <button className="card role" onClick={() => setRole('developer')}>
              <h2>Developer</h2>
              <p>Build your profile, showcase your skills, and let GitHub back them up.</p>
              <span className="btn">Continue as Developer</span>
            </button>
            <button className="card role" onClick={() => setRole('recruiter')}>
              <h2>Recruiter</h2>
              <p>Create your company profile and publish jobs.</p>
              <span className="btn">Continue as Recruiter</span>
            </button>
          </div>
          <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const u = await signUp({ role, ...form });
      nav(u.role === 'developer' ? '/developer/profile' : '/recruiter/profile', { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <b className="brand dark">Skillora</b>
        <h1>Create your account</h1>
        <p className="muted">
          Registering as <b>{role === 'developer' ? 'Developer' : 'Recruiter'}</b> ·{' '}
          <button type="button" className="linklike inline" onClick={() => setRole(null)}>Change role</button>
        </p>
        <Field label="Full name"><input className="in" value={form.fullName} onChange={set('fullName')} /></Field>
        {role === 'recruiter' && <Field label="Company name"><input className="in" value={form.companyName} onChange={set('companyName')} /></Field>}
        <Field label="Email"><input className="in" type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="At least 8 characters."><input className="in" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirm password"><input className="in" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
        {error && <div className="alert err" role="alert">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        <p className="muted">Already registered? <Link to="/login">Back to Login</Link></p>
      </form>
    </div>
  );
}
