// Compatibility between a developer and a job.
//
// Formula (change WEIGHT / thresholds here if the team agrees on a different one):
//   every job skill has a weight: required = 2, preferred = 1
//   skill on the Skill Sheet AND verified by GitHub evidence  -> counts 100%  (strong match)
//   skill on the Skill Sheet but NOT verified by GitHub        -> counts 50%   (weak match: unverified)
//   skill not on the Skill Sheet                               -> counts 0%    (weak match: missing)
//   score = earned weight / total weight x 100
//   status: 75+ Strong match, 50-74 Moderate match, below 50 Weak match
//
// This runs in the browser until the FastAPI matching engine exists. Replace evaluate() with that API then.

import { verificationRows } from './verify.js';
import { LIB_SKILL } from '../api/libraryMap.js';

export const WEIGHT = { required: 2, preferred: 1 };

export function statusFor(score) {
  return score >= 75 ? 'Strong match' : score >= 50 ? 'Moderate match' : 'Weak match';
}

export function evaluate(job, dev) {
  const rows = new Map(verificationRows(dev).map((r) => [r.skill.toLowerCase(), r]));
  const items = [
    ...job.requiredSkills.map((skill) => ({ skill, kind: 'required' })),
    ...job.preferredSkills.map((skill) => ({ skill, kind: 'preferred' })),
  ];
  const strong = [];
  const weak = [];
  let earned = 0;
  let total = 0;
  items.forEach((item) => {
    const w = WEIGHT[item.kind];
    total += w;
    const row = rows.get(item.skill.toLowerCase());
    if (row && row.status === 'verified') {
      earned += w;
      strong.push(item);
    } else if (row) {
      earned += w / 2;
      weak.push({ ...item, reason: 'unverified' });
    } else {
      weak.push({ ...item, reason: 'missing' });
    }
  });
  const score = total ? Math.round((earned / total) * 100) : 0;
  const overlap = strong.length + weak.filter((w) => w.reason === 'unverified').length;
  return { score, status: statusFor(score), strong, weak, overlap, total: items.length };
}

// Jobs ranked by compatibility. onlyMatching keeps jobs that share at least one skill with the developer.
export function rank(jobs, dev, onlyMatching = true) {
  return jobs
    .map((job) => ({ job, result: evaluate(job, dev) }))
    .filter((x) => !onlyMatching || x.result.overlap > 0)
    .sort((a, b) => b.result.score - a.result.score || new Date(b.job.postedAt) - new Date(a.job.postedAt));
}

// Libraries that count as evidence for a skill, e.g. FastAPI -> fastapi
const librariesFor = (skill) =>
  Object.entries(LIB_SKILL)
    .filter(([lib, s]) => s === skill && lib.toLowerCase() !== skill.toLowerCase())
    .map(([lib]) => lib)
    .slice(0, 2);

export function recommendation({ skill, reason }) {
  const libs = librariesFor(skill);
  const hint = libs.length ? ` For example, a repository that lists ${libs.join(' or ')} in package.json or requirements.txt counts as evidence.` : '';
  return reason === 'missing'
    ? `Learn ${skill} and build a small project with it. Push it to GitHub, then sync GitHub.${hint}`
    : `${skill} is on your profile but GitHub shows no evidence for it. Add or link a repository that uses ${skill}, then sync GitHub.${hint}`;
}

export function daysAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
}

// Developers ranked for one job (used by the recruiter). Keeps developers who share at least one skill with the job.
export function rankDevelopers(job, devs, onlyMatching = true) {
  return devs
    .map((dev) => ({ dev, result: evaluate(job, dev) }))
    .filter((x) => !onlyMatching || x.result.overlap > 0)
    .sort((a, b) => b.result.score - a.result.score || a.dev.fullName.localeCompare(b.dev.fullName));
}
