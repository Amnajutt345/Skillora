import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { MAX_REPOS_PER_ANALYSIS, analyzeRepos } from '../../api/github.js';
import { EVIDENCE_LABEL, verificationRows } from '../../lib/verify.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead, fmtDate } from '../../components/ui.jsx';

const BADGE = {
  verified: ['ok', '✓ Verified from GitHub'],
  not_found: ['warn', '✗ Not found on GitHub'],
  not_analyzed: ['', 'Not analyzed yet'],
};

export default function Analysis() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const [catalogue, setCatalogue] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
  api.listSkills()
    .then(setCatalogue)
    .catch((e) => setError(e.message));
}, []);

  const repos = profile.github?.repos || [];
  const batch = repos.filter((r) => r.selected).slice(0, MAX_REPOS_PER_ANALYSIS);
  const analysis = profile.analysis;
  const rows = verificationRows(profile);
  const inCatalogue = (name) => catalogue.some((s) => s.name.toLowerCase() === name.toLowerCase());
  const extra = analysis ? Object.keys(analysis.evidence).filter((s) => !profile.skills.some((p) => p.toLowerCase() === s.toLowerCase())) : [];
  const libraries = analysis
    ? Object.entries(analysis.evidence).flatMap(([skill, list]) => list.filter((e) => e.type === 'library').map((e) => ({ skill, ...e })))
    : [];

const run = async () => {
  setError('');
  setProgress({ done: 0, total: batch.length });

  try {
    const result = await analyzeRepos(batch, {
      token: sessionStorage.getItem('skillora_gh_token') || undefined,
      catalogue: catalogue.map((s) => s.name),
      onProgress: (done, total) => setProgress({ done, total }),
    });
    await api.saveAnalysis(profile.id, result);
    refresh();
    toast.success('Analysis finished. Your Skill Sheet is updated.');
  } catch (e) {
    setError(e.message);
  } finally {
    setProgress(null);
  }
};

  const addToProfile = async (skill) => {
    await api.updateDeveloper(profile.id, { skills: [...profile.skills, skill], sources: { [skill]: 'GitHub' } });
    refresh();
    toast.success(`${skill} added to your profile.`);
  };

  if (!profile.github) {
    return (
      <div>
        <PageHead title="Analysis and Skill Sheet" />
        <Empty>
          Pull your repositories first. <Link to="/developer/github">Go to GitHub Repositories</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHead title="Analysis and Skill Sheet" subtitle="Skillora looks for evidence of your claimed skills in your repositories.">
        <button className="btn" onClick={run} disabled={!!progress || batch.length === 0}>
          {progress ? `Analyzing ${progress.done}/${progress.total}…` : analysis ? 'Re-analyze' : 'Run Analysis'}
        </button>
      </PageHead>

      <section className="card stack">
        <h2>How the evidence is found</h2>
        <p className="muted">
          For each selected repository Skillora reads the <b>languages</b> GitHub reports, the repository <b>topics</b>, and the <b>libraries</b> listed in
          <code> package.json</code> and <code>requirements.txt</code>. Library-based evidence shows which frameworks you actually use, not only which language you wrote.
        </p>
        <p className="muted">
          {batch.length} repositor{batch.length === 1 ? 'y' : 'ies'} will be analyzed
          {repos.filter((r) => r.selected).length > MAX_REPOS_PER_ANALYSIS && ` (the ${MAX_REPOS_PER_ANALYSIS} most recently updated of your selection, to stay within GitHub's rate limit)`}.
          Change the selection under <Link to="/developer/github">GitHub Repositories</Link>.
        </p>
        {analysis && <p className="muted">Last analysis: {fmtDate(analysis.ranAt)} · {analysis.reposAnalyzed} repositories.</p>}
        {error && <div className="alert err" role="alert">{error}</div>}
        {analysis?.errors?.length > 0 && (
          <div className="alert warn">
            Some repositories could not be fully analyzed:
            <ul>{analysis.errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Skill Sheet</h2>
        {rows.length === 0 ? (
          <Empty>No claimed skills yet. Add skills under <Link to="/developer/profile">My Profile</Link>.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead><tr><th>Skill</th><th>Verification</th><th>Evidence</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.skill}>
                    <tr>
                      <td><b>{r.skill}</b></td>
                      <td><Chip tone={BADGE[r.status][0]}>{BADGE[r.status][1]}</Chip></td>
                      <td>{r.evidence.length ? `${r.evidence.length} item${r.evidence.length > 1 ? 's' : ''}` : '—'}</td>
                      <td>
                        {r.evidence.length > 0 && (
                          <button className="btn ghost" onClick={() => setOpen(open === r.skill ? null : r.skill)}>
                            {open === r.skill ? 'Hide' : 'Show evidence'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {open === r.skill && (
                      <tr>
                        <td colSpan="4">
                          <ul className="evidence">
                            {r.evidence.map((e, i) => (
                              <li key={i}><Chip>{EVIDENCE_LABEL[e.type]}</Chip> <b>{e.repo}</b> — {e.detail}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {analysis && (
        <section className="card stack">
          <h2>Also found on GitHub</h2>
          <p className="muted">Skills with evidence in your repositories that are not on your profile yet.</p>
          {extra.length === 0 ? (
            <span className="muted">Nothing new found.</span>
          ) : (
            <div className="chips">
              {extra.map((s) => (
                <Chip key={s}>
                  {s}
                  {inCatalogue(s) ? (
                    <button type="button" className="x add" onClick={() => addToProfile(s)}>+ Add</button>
                  ) : (
                    <small> (not in catalogue)</small>
                  )}
                </Chip>
              ))}
            </div>
          )}
        </section>
      )}

      {analysis && (
        <section className="card">
          <h2>Library-based evidence</h2>
          {libraries.length === 0 ? (
            <Empty>No known libraries were found in package.json or requirements.txt of the analyzed repositories.</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead><tr><th>Skill</th><th>Repository</th><th>Found in</th></tr></thead>
                <tbody>
                  {libraries.map((l, i) => (
                    <tr key={i}><td>{l.skill}</td><td>{l.repo}</td><td>{l.detail}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
