// Repository pull and analysis using the public GitHub REST API (runs in the browser).
// OAuth sign-in will be added through the FastAPI backend later; for now we pull by username.
// Unauthenticated GitHub requests are limited to 60 per hour; an optional token raises that.

import { LANG_SKILL, LIB_SKILL } from './libraryMap.js';

const API = 'https://api.github.com';
export const MAX_REPOS_PER_ANALYSIS = 15;

const headers = (token) => ({
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function gh(url, token) {
  let res;
  try {
    res = await fetch(url, { headers: headers(token) });
  } catch {
    throw new Error('Could not reach GitHub. Check your internet connection.');
  }
  if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = res.headers.get('x-ratelimit-reset');
    const when = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'later';
    throw new Error(`GitHub rate limit reached. Try again after ${when}, or add a personal access token.`);
  }
  if (res.status === 401) throw new Error('GitHub rejected the access token.');
  if (res.status === 404) throw new Error('Not found on GitHub.');
  if (!res.ok) throw new Error(`GitHub returned an error (${res.status}).`);
  return res.json();
}

export async function pullRepos(username, token) {
  const user = username.trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(user)) throw new Error('Enter a valid GitHub username.');
  const all = [];
  try {
    for (let page = 1; page <= 3; page += 1) {
      const data = await gh(`${API}/users/${user}/repos?per_page=100&sort=updated&page=${page}`, token);
      all.push(...data);
      if (data.length < 100) break;
    }
  } catch (e) {
    if (e.message === 'Not found on GitHub.') throw new Error(`GitHub user "${user}" was not found.`);
    throw e;
  }
  return {
    username: user,
    repos: all.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description || '',
      url: r.html_url,
      language: r.language || '',
      stars: r.stargazers_count,
      fork: r.fork,
      archived: r.archived,
      topics: r.topics || [],
      defaultBranch: r.default_branch,
      updatedAt: r.pushed_at || r.updated_at,
    })),
  };
}

// ---- library-based evidence: read dependency files from the repository ----
const parsePackageJson = (text) => {
  try {
    const j = JSON.parse(text);
    return Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.peerDependencies });
  } catch {
    return [];
  }
};

const parseRequirements = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'))
    .map((l) => l.split(/[=<>!~;\[\s@]/)[0]);

const DEP_FILES = [
  ['package.json', parsePackageJson],
  ['requirements.txt', parseRequirements],
];

async function rawFile(repo, file) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo.fullName}/${repo.defaultBranch}/${file}`);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function analyzeRepos(repos, { token, catalogue, onProgress }) {
  const names = new Map(catalogue.map((n) => [n.toLowerCase(), n]));
  const evidence = {};
  const errors = [];
  const seen = new Set();

  const add = (skill, repo, type, detail) => {
    if (!skill) return;
    const canonical = names.get(skill.toLowerCase()) || skill;
    const key = `${canonical}|${repo}|${type}|${detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    (evidence[canonical] ||= []).push({ repo, type, detail });
  };

  let done = 0;
  for (const repo of repos) {
    try {
      const langs = await gh(`${API}/repos/${repo.fullName}/languages`, token);
      const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
      for (const [lang, bytes] of Object.entries(langs)) {
        const share = Math.round((bytes / total) * 100);
        const skill = LANG_SKILL[lang] || lang;
        if (share >= 3 && names.has(skill.toLowerCase())) add(skill, repo.name, 'language', `${share}% of the code is ${lang}`);
      }
      for (const topic of repo.topics) {
        const skill = LIB_SKILL[topic.toLowerCase()] || names.get(topic.toLowerCase());
        if (skill) add(skill, repo.name, 'topic', `Repository topic: ${topic}`);
      }
      for (const [file, parse] of DEP_FILES) {
        const text = await rawFile(repo, file);
        if (!text) continue;
        for (const lib of parse(text)) {
          const skill = LIB_SKILL[lib.toLowerCase()];
          if (skill) add(skill, repo.name, 'library', `${file}: ${lib}`);
        }
      }
    } catch (e) {
      errors.push(`${repo.name}: ${e.message}`);
      if (/rate limit/i.test(e.message)) {
        done += 1;
        onProgress?.(done, repos.length);
        break;
      }
    }
    done += 1;
    onProgress?.(done, repos.length);
  }
  return { ranAt: new Date().toISOString(), reposAnalyzed: done, repoNames: repos.map((r) => r.name), evidence, errors };
}
