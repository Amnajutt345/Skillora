import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';

export default function Login({ admin = false }) {
  const { user, signIn } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const u = await signIn(form.email, form.password, admin);
      nav(homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <b className="brand dark">Skillora</b>
        <h1>{admin ? 'Admin Portal' : 'Login'}</h1>
        <p className="muted">{admin ? 'Sign in with your administrator account.' : 'Sign in to your Developer or Recruiter account.'}</p>
        <Field label="Email address">
          <input className="in" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="in" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password
        </label>
        {error && <div className="alert err" role="alert">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        {admin ? (
          <p className="muted small">Admin accounts are not created through public registration.</p>
        ) : (
          <p className="muted">New to Skillora? <Link to="/register">Create account</Link></p>
        )}
      </form>
    </div>
  );
}
