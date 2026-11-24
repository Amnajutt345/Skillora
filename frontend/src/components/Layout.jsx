import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Confirm } from './ui.jsx';

const NAV = {
  developer: [
    ['/developer/dashboard', 'Dashboard'],
    ['/developer/view', 'View Profile'],
    ['/developer/profile', 'Manage Profile'],
    ['/developer/cv', 'Upload CV'],
    ['/developer/github', 'GitHub Repositories'],
    ['/developer/analysis', 'Analysis and Skill Sheet'],
    ['/developer/jobs', 'Job Recommendations'],
    ['/developer/skill-recommendations', 'Skill Recommendations'],
    ['/developer/applications', 'My Applications'],
    ['/developer/notifications', 'Notifications'],
    ['/developer/settings', 'Settings'],
    ['/developer/help', 'Help'],
  ],
  recruiter: [
    ['/recruiter/dashboard', 'Dashboard'],
    ['/recruiter/profile', 'Company Profile'],
    ['/recruiter/jobs', 'Manage Jobs'],
    ['/recruiter/jobs/new', 'Create Job'],
    ['/recruiter/developers', 'Developer Recommendations'],
    ['/recruiter/settings', 'Settings'],
    ['/recruiter/help', 'Help'],
  ],
  admin: [
    ['/admin/dashboard', 'Dashboard'],
    ['/admin/developers', 'Manage Developers'],
    ['/admin/companies', 'Manage Companies'],
    ['/admin/skills', 'Manage Skills'],
    ['/admin/statistics', 'Statistics'],
  ],
};

export default function Layout({ role }) {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [asking, setAsking] = useState(false);

  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  const name = profile?.fullName || profile?.recruiterName || 'Administrator';
  return (
    <div className="shell">
      <nav className="sidebar" aria-label={`${role} navigation`}>
        <b className="brand">Skillora</b>
        {NAV[role].map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/recruiter/jobs'} className={({ isActive }) => (isActive ? 'on' : '')}>
            {label}
          </NavLink>
        ))}
        <button className="linklike" onClick={() => setAsking(true)}>
          Logout
        </button>
      </nav>
      <div className="content">
        <header className="topbar">
          <span className="muted">
            {role === 'admin' ? 'Admin portal' : role === 'developer' ? 'Developer' : 'Recruiter'}
          </span>
          <span>
            <b>{name}</b> <span className="muted">· {user.email}</span>
          </span>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
      {asking && (
        <Confirm
          title="Log out"
          message="Are you sure you want to log out?"
          confirmLabel="Logout"
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            signOut();
            nav(role === 'admin' ? '/admin/login' : '/login', { replace: true });
          }}
        />
      )}
    </div>
  );
}
