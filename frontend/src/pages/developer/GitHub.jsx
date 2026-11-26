import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { pullRepos } from '../../api/github.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Confirm, Empty, Field, PageHead, fmtDate } from '../../components/ui.jsx';

export default function GitHub() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const gh = profile.github;
  const [username, setUsername] = useState(gh?.username || '');
  const [token, setToken] = useState(() => sessionStorage.getItem('skillora_gh_token') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState(false);
  const repos = gh?.repos || [];
  const selected = repos.filter((r) => r.selected).length;

  const changeToken = (v) => {
    setToken(v);
    sessionStorage.setItem('skillora_gh_token', v);
  };

 const pull = async () => {
  setError('');
  setBusy(true);

  try {
    const data = await pullRepos(username, token || undefined);
    await api.saveRepos(profile.id, data);
    refresh();
    toast.success(`Pulled ${data.repos.length} repositories from GitHub.`);
  } catch (e) {
    setError(e.message);
  } finally {
    setBusy(false);
  }
};

  const toggle = async (repo, checked) => {
    await api.setRepoSelection(profile.id, repo.id, checked);
    refresh();
  };

  const setAll = async (checked) => {
    for (const r of repos) await api.setRepoSelection(profile.id, r.id, checked);
    refresh();
  };

  return (
    <div>
      <PageHead title="GitHub Repositories" subtitle="Pull your repositories so Skillora can analyze them for skill evidence.">
        {gh && <Link className="btn" to="/developer/analysis">Go to Analysis</Link>}
      </PageHead>

      <section className="card stack">
        <h2>Connect and pull</h2>
        <div className="alert info">
          Repositories are pulled from the public GitHub API using your username. GitHub OAuth sign-in will be added through the Skillora backend.
        </div>
        <div className="row">
          <Field label="GitHub username">
            <input className="in" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your GitHub username" />
          </Field>
          <button className="btn" onClick={pull} disabled={busy || !username.trim()}>
            {busy ? 'Pulling…' : gh ? 'Sync GitHub' : 'Pull Repositories'}
          </button>
          {gh && <button className="btn ghost" onClick={() => setAsking(true)}>Disconnect</button>}
        </div>
        <details>
          <summary>Optional: GitHub access token</summary>
          <Field label="Personal access token" hint="Raises the GitHub rate limit (60 requests per hour without one). Kept for this browser session only.">
            <input className="in" type="password" value={token} onChange={(e) => changeToken(e.target.value)} autoComplete="off" />
          </Field>
        </details>
        {error && <div className="alert err" role="alert">{error}</div>}
        {gh && <p className="muted">Connected as <b>{gh.username}</b> · last pulled {fmtDate(gh.pulledAt)}</p>}
      </section>

      <section className="card">
        <div className="row between">
          <h2>Repositories {gh && <Chip>{repos.length}</Chip>}</h2>
          {repos.length > 0 && (
            <div className="row">
              <span className="muted">{selected} selected for analysis</span>
              <button className="btn ghost" onClick={() => setAll(true)}>Select all</button>
              <button className="btn ghost" onClick={() => setAll(false)}>Clear</button>
            </div>
          )}
        </div>
        {!gh && <Empty>No repositories yet. Enter your GitHub username and pull them.</Empty>}
        {gh && repos.length === 0 && <Empty>This GitHub account has no public repositories.</Empty>}
        {repos.length > 0 && (
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Analyze</th><th>Repository</th><th>Language</th><th>Stars</th><th>Last pushed</th></tr>
              </thead>
              <tbody>
                {repos.map((r) => (
                  <tr key={r.id}>
                    <td><input type="checkbox" aria-label={`Analyze ${r.name}`} checked={!!r.selected} onChange={(e) => toggle(r, e.target.checked)} /></td>
                    <td>
                      <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>
                      {r.fork && <Chip>fork</Chip>}
                      {r.archived && <Chip>archived</Chip>}
                      {r.description && <div className="muted small">{r.description}</div>}
                    </td>
                    <td>{r.language || '—'}</td>
                    <td>{r.stars}</td>
                    <td>{fmtDate(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {asking && (
        <Confirm
          title="Disconnect GitHub"
          message="This removes the pulled repositories and the analysis results from your profile."
          confirmLabel="Disconnect"
          danger
          onCancel={() => setAsking(false)}
          onConfirm={async () => {
            await api.disconnectGithub(profile.id);
            refresh();
            setAsking(false);
            toast.success('GitHub disconnected.');
          }}
        />
      )}
    </div>
  );
}
