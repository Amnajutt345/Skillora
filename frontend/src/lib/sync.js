import * as api from '../api/api.js';
import { MAX_REPOS_PER_ANALYSIS, analyzeRepos, pullRepos } from '../api/github.js';

// Pull the repositories again and re-run the analysis (the "Sync GitHub" step of the flow).
export async function syncGithub(profile, onProgress) {
  if (!profile.github) throw new Error('Connect GitHub first.');
  const token = sessionStorage.getItem('skillora_gh_token') || undefined;
  const data = await pullRepos(profile.github.username, token);
  await api.saveRepos(profile.id, data);
  const fresh = api.getCurrent().profile.github.repos.filter((r) => r.selected).slice(0, MAX_REPOS_PER_ANALYSIS);
  const catalogue = (await api.listSkills()).map((s) => s.name);
  const result = await analyzeRepos(fresh, { token, catalogue, onProgress });
  await api.saveAnalysis(profile.id, result);
  return result;
}
