// Data layer used by every page. Each function is async so it can later be swapped for a
// fetch() call to the FastAPI backend without changing the pages.

import { load, save, uid, sha256, getSession, setSession, clearSession } from './store.js';
import { verificationRows } from '../lib/verify.js';

const fail = (message) => {
  throw new Error(message);
};
const clean = (v) => String(v ?? '').trim();
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, typeof obj[k] === 'string' ? clean(obj[k]) : obj[k]]));

const DEV_FIELDS = ['fullName', 'title', 'bio', 'education', 'experience', 'location', 'contact'];
const REC_FIELDS = ['recruiterName', 'companyName', 'description', 'industry', 'website', 'contact', 'location'];

// ---------- authentication ----------
export async function register({ role, fullName, email, password, companyName }) {
  const db = load();
  const mail = clean(email).toLowerCase();
  if (!['developer', 'recruiter'].includes(role)) fail('Select a role.');
  if (!clean(fullName) || !mail || !password) fail('Fill in all required fields.');
  if (!/^\S+@\S+\.\S+$/.test(mail)) fail('Enter a valid email address.');
  if (password.length < 8) fail('Password must be at least 8 characters.');
  if (db.users.some((u) => u.email === mail)) fail('An account with this email already exists.');
  if (role === 'recruiter' && !clean(companyName)) fail('Enter your company name.');

  const user = { id: uid(), email: mail, passHash: await sha256(password), role, status: 'active', createdAt: new Date().toISOString() };
  db.users.push(user);
  if (role === 'developer') {
    db.developers.push({ id: uid(), userId: user.id, fullName: clean(fullName), title: '', bio: '', education: '', experience: '', location: '', contact: '', skills: [], skillSources: {}, cv: null, github: null, analysis: null });
  } else {
    db.recruiters.push({
      id: uid(), userId: user.id, recruiterName: clean(fullName), companyName: clean(companyName), description: '', industry: '', website: '', contact: '', location: '',
      approval: { status: 'draft', feedback: '', submittedAt: null },
    });
  }
  save(db);
  setSession(user.id);
  return user;
}

export async function login(email, password, { admin = false } = {}) {
  const db = load();
  const user = db.users.find((u) => u.email === clean(email).toLowerCase());
  if (!user || user.passHash !== (await sha256(password))) fail('Incorrect email or password.');
  if (admin && user.role !== 'admin') fail('This account is not an administrator.');
  if (!admin && user.role === 'admin') fail('Administrators sign in through the admin login.');
  if (user.status !== 'active') fail('This account has been deactivated. Contact an administrator.');
  setSession(user.id);
  return user;
}

export function logout() {
  clearSession();
}

export function getCurrent() {
  const id = getSession();
  if (!id) return null;
  const db = load();
  const user = db.users.find((u) => u.id === id);
  if (!user || user.status !== 'active') return null;
  const profile = user.role === 'developer' ? db.developers.find((d) => d.userId === id) : user.role === 'recruiter' ? db.recruiters.find((r) => r.userId === id) : null;
  return { user: { id: user.id, email: user.email, role: user.role }, profile };
}

const withUser = (db, rec) => {
  const u = db.users.find((x) => x.id === rec.userId);
  return { ...rec, email: u?.email ?? '', status: u?.status ?? 'active' };
};

// ---------- developers ----------
export async function listDevelopers() {
  const db = load();
  return db.developers.map((d) => withUser(db, d));
}

export async function updateDeveloper(id, patch) {
  const db = load();
  const dev = db.developers.find((d) => d.id === id);
  if (!dev) fail('Developer not found.');
  const next = pick(patch, DEV_FIELDS);
  if ('fullName' in next && !next.fullName) fail('Full name is required.');
  if (Array.isArray(patch.skills)) {
    const catalogue = new Map(db.skills.map((s) => [s.name.toLowerCase(), s.name]));
    next.skills = [...new Set(patch.skills.map((s) => catalogue.get(String(s).toLowerCase())).filter(Boolean))];
    // remember where each skill came from (CV, GitHub or Manual)
    const sources = { ...(dev.skillSources || {}), ...(patch.sources || {}) };
    next.skills.forEach((s) => {
      if (!sources[s]) sources[s] = 'Manual';
    });
    Object.keys(sources).forEach((k) => {
      if (!next.skills.includes(k)) delete sources[k];
    });
    next.skillSources = sources;
  }
  Object.assign(dev, next);
  save(db);
  return withUser(db, dev);
}

export async function setUserStatus(userId, status) {
  const db = load();
  const user = db.users.find((u) => u.id === userId);
  if (!user) fail('Account not found.');
  if (user.role === 'admin') fail('The administrator account cannot be deactivated.');
  user.status = status === 'active' ? 'active' : 'inactive';
  save(db);
}

// ---------- GitHub data (pulled in the browser, stored per developer) ----------
export async function saveRepos(devId, { username, repos }) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  const previous = new Map((dev.github?.repos || []).map((r) => [r.id, r.selected]));
  dev.github = { username, pulledAt: new Date().toISOString(), repos: repos.map((r) => ({ ...r, selected: previous.has(r.id) ? previous.get(r.id) : !r.fork && !r.archived })) };
  save(db);
}

export async function setRepoSelection(devId, repoId, selected) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  const repo = dev?.github?.repos.find((r) => r.id === repoId);
  if (!repo) fail('Repository not found.');
  repo.selected = selected;
  save(db);
}

export async function disconnectGithub(devId) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  dev.github = null;
  dev.analysis = null;
  save(db);
}

export async function saveAnalysis(devId, analysis) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  dev.analysis = analysis;
  save(db);
}

// ---------- recruiters / companies ----------
export async function listRecruiters() {
  const db = load();
  return db.recruiters.map((r) => withUser(db, r));
}

export async function updateRecruiter(id, patch) {
  const db = load();
  const rec = db.recruiters.find((r) => r.id === id);
  if (!rec) fail('Recruiter not found.');
  const next = pick(patch, REC_FIELDS);
  if ('companyName' in next && !next.companyName) fail('Company name is required.');
  if ('recruiterName' in next && !next.recruiterName) fail('Recruiter name is required.');
  Object.assign(rec, next);
  save(db);
  return withUser(db, rec);
}

export async function submitCompany(id) {
  const db = load();
  const rec = db.recruiters.find((r) => r.id === id);
  if (!rec) fail('Recruiter not found.');
  if (!['draft', 'needs_update'].includes(rec.approval.status)) fail('This profile has already been submitted.');
  if (!rec.companyName || !rec.description) fail('Add the company name and description before submitting.');
  rec.approval = { status: 'pending', feedback: '', submittedAt: new Date().toISOString() };
  save(db);
}

export async function reviewCompany(id, decision, feedback = '') {
  const db = load();
  const rec = db.recruiters.find((r) => r.id === id);
  if (!rec) fail('Recruiter not found.');
  if (rec.approval.status !== 'pending') fail('Only submitted companies can be reviewed.');
  if (decision === 'needs_update' && !clean(feedback)) fail('Add feedback so the recruiter knows what to update.');
  rec.approval = { ...rec.approval, status: decision === 'approved' ? 'approved' : 'needs_update', feedback: decision === 'approved' ? '' : clean(feedback), reviewedAt: new Date().toISOString() };
  save(db);
}

// ---------- skill catalogue ----------
export const skillUsage = (db, name) => db.developers.filter((d) => d.skills.some((s) => s.toLowerCase() === name.toLowerCase())).length;

export async function listSkills() {
  const db = load();
  return db.skills.map((s) => ({ ...s, usage: skillUsage(db, s.name) })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function addSkill({ name, category }) {
  const db = load();
  const n = clean(name);
  if (!n) fail('Enter a skill name.');
  if (db.skills.some((s) => s.name.toLowerCase() === n.toLowerCase())) fail('This skill already exists.');
  db.skills.push({ id: uid(), name: n, category: clean(category) || 'Other' });
  save(db);
}

export async function updateSkill(id, { name, category }) {
  const db = load();
  const skill = db.skills.find((s) => s.id === id);
  if (!skill) fail('Skill not found.');
  const n = clean(name);
  if (!n) fail('Enter a skill name.');
  if (db.skills.some((s) => s.id !== id && s.name.toLowerCase() === n.toLowerCase())) fail('Another skill already uses this name.');
  const old = skill.name;
  skill.name = n;
  skill.category = clean(category) || 'Other';
  if (old !== n) {
    db.developers.forEach((d) => {
      d.skills = d.skills.map((s) => (s === old ? n : s));
      if (d.skillSources?.[old]) {
        d.skillSources[n] = d.skillSources[old];
        delete d.skillSources[old];
      }
      if (d.analysis?.evidence?.[old]) {
        d.analysis.evidence[n] = d.analysis.evidence[old];
        delete d.analysis.evidence[old];
      }
    });
  }
  save(db);
}

export async function deleteSkill(id) {
  const db = load();
  const skill = db.skills.find((s) => s.id === id);
  if (!skill) fail('Skill not found.');
  const used = skillUsage(db, skill.name);
  if (used > 0) fail(`"${skill.name}" is on ${used} developer profile${used > 1 ? 's' : ''}. Remove it from those profiles first.`);
  db.skills = db.skills.filter((s) => s.id !== id);
  save(db);
}

// ---------- statistics (always counted from stored data) ----------
export async function getStats() {
  const db = load();
  const approvals = { draft: 0, pending: 0, approved: 0, needs_update: 0 };
  db.recruiters.forEach((r) => {
    approvals[r.approval.status] += 1;
  });
  const counts = new Map();
  db.developers.forEach((d) => d.skills.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
  const topSkills = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  let verified = 0;
  let total = 0;
  const analyzed = db.developers.filter((d) => d.analysis);
  analyzed.forEach((d) =>
    verificationRows(d).forEach((r) => {
      total += 1;
      if (r.status === 'verified') verified += 1;
    })
  );
  return {
    developers: db.developers.length,
    recruiters: db.recruiters.length,
    skills: db.skills.length,
    approvals,
    connectedGithub: db.developers.filter((d) => d.github).length,
    analyzedDevelopers: analyzed.length,
    verified,
    claimedInAnalyzed: total,
    topSkills,
  };
}

export async function getAdminStatistics({ from = '', to = '' } = {}) {
  const start = from ? Date.parse(`${from}T00:00:00.000Z`) : -Infinity;
  const end = to ? Date.parse(`${to}T00:00:00.000Z`) + 86400000 : Infinity;
  if ((from && !Number.isFinite(start)) || (to && !Number.isFinite(end)) || start >= end) {
    fail('Enter a valid date range.');
  }

  const inRange = (value) => {
    if (!from && !to) return true;
    const time = value ? Date.parse(value) : NaN;
    return Number.isFinite(time) && time >= start && time < end;
  };
  const db = load();
  const users = new Map(db.users.map((user) => [user.id, user]));
  const developers = db.developers.filter((dev) => inRange(users.get(dev.userId)?.createdAt));
  const recruiters = db.recruiters.filter((rec) => inRange(users.get(rec.userId)?.createdAt));
  const jobs = db.jobs.filter((job) => inRange(job.createdAt || job.postedAt));
  const applications = db.applications.filter((application) => inRange(application.appliedAt));
  const skillCounts = new Map();
  developers.forEach((dev) => dev.skills.forEach((skill) => skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)));

  let verified = 0;
  let claimedInAnalyzed = 0;
  let analyzedDevelopers = 0;
  developers.forEach((dev) => {
    if (!dev.analysis) return;
    analyzedDevelopers += 1;
    verificationRows(dev).forEach((row) => {
      claimedInAnalyzed += 1;
      if (row.status === 'verified') verified += 1;
    });
  });

  const activityByMonth = new Map();
  const addActivity = (date, key) => {
    if (!date || !Number.isFinite(Date.parse(date))) return;
    const month = date.slice(0, 7);
    if (!activityByMonth.has(month)) activityByMonth.set(month, { month, developers: 0, recruiters: 0, jobs: 0, applications: 0 });
    activityByMonth.get(month)[key] += 1;
  };
  developers.forEach((dev) => addActivity(users.get(dev.userId)?.createdAt, 'developers'));
  recruiters.forEach((rec) => addActivity(users.get(rec.userId)?.createdAt, 'recruiters'));
  jobs.forEach((job) => addActivity(job.createdAt || job.postedAt, 'jobs'));
  applications.forEach((application) => addActivity(application.appliedAt, 'applications'));

  return {
    developers: developers.length,
    recruiters: recruiters.length,
    jobs: jobs.length,
    applications: applications.length,
    connectedGithub: developers.filter((dev) => dev.github).length,
    analyzedDevelopers,
    verified,
    unverified: claimedInAnalyzed - verified,
    claimedInAnalyzed,
    topSkills: [...skillCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8),
    activity: [...activityByMonth.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
  };
}

// ---------- CV (text and skills are extracted in the browser, then confirmed here) ----------
export async function confirmCv(devId, { fileName, text, skills }) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  const catalogue = new Map(db.skills.map((s) => [s.name.toLowerCase(), s.name]));
  const confirmed = [...new Set(skills.map((s) => catalogue.get(String(s).toLowerCase())).filter(Boolean))];
  dev.skills = [...new Set([...dev.skills, ...confirmed])];
  dev.skillSources = dev.skillSources || {};
  confirmed.forEach((s) => {
    if (!dev.skillSources[s] || dev.skillSources[s] === 'Manual') dev.skillSources[s] = 'CV';
  });
  dev.cv = { fileName, uploadedAt: new Date().toISOString(), text: String(text || '').slice(0, 20000), skillCount: confirmed.length };
  save(db);
}

// ---------- jobs, applications, notifications ----------
// Jobs are created by recruiters (recruiter module). Developers only see published jobs of approved companies.
const visibleJobs = (db) =>
  db.jobs
    .filter((j) => j.status === 'published')
    .map((j) => ({ job: j, rec: db.recruiters.find((r) => r.id === j.recruiterId) }))
    .filter(({ rec }) => rec && rec.approval.status === 'approved')
    .map(({ job, rec }) => ({ ...job, companyName: rec.companyName, recruiterName: rec.recruiterName }));

export async function listJobs() {
  return visibleJobs(load()).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
}

export async function getJob(id) {
  const job = visibleJobs(load()).find((j) => j.id === id);
  if (!job) fail('This job is no longer available.');
  return job;
}

export async function listApplications(devId) {
  const db = load();
  const jobs = new Map(db.jobs.map((j) => [j.id, j]));
  return db.applications
    .filter((a) => a.developerId === devId)
    .map((a) => {
      const job = jobs.get(a.jobId);
      const rec = job && db.recruiters.find((r) => r.id === job.recruiterId);
      return { ...a, job: job ? { ...job, companyName: rec?.companyName || '—' } : null };
    })
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export async function applyForJob(devId, jobId) {
  const db = load();
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  if (!visibleJobs(db).some((j) => j.id === jobId)) fail('This job is no longer available.');
  if (db.applications.some((a) => a.developerId === devId && a.jobId === jobId)) fail('You have already applied for this job.');
  db.applications.push({ id: uid(), jobId, developerId: devId, appliedAt: new Date().toISOString(), status: 'applied' });
  save(db);
}

export async function listNotifications(devId) {
  return load().notifications.filter((n) => n.developerId === devId).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
}

export async function markNotificationRead(id, read = true) {
  const db = load();
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = read;
  save(db);
}

// ---------- recruiter: job posts ----------
const recOf = (db, id) => db.recruiters.find((r) => r.id === id);
const ownJob = (db, jobId, recId) => {
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job || job.recruiterId !== recId) fail('Job not found.');
  return job;
};
const catalogueSkills = (db, list) => {
  const cat = new Map(db.skills.map((s) => [s.name.toLowerCase(), s.name]));
  return [...new Set((list || []).map((s) => cat.get(String(s).toLowerCase())).filter(Boolean))];
};

export async function listRecruiterJobs(recId) {
  const db = load();
  return db.jobs
    .filter((j) => j.recruiterId === recId)
    .map((j) => ({
      ...j,
      applicants: db.applications.filter((a) => a.jobId === j.id).length,
      shortlisted: db.decisions.filter((d) => d.jobId === j.id).length,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getRecruiterJob(recId, jobId) {
  return ownJob(load(), jobId, recId);
}

// Creates or updates a draft. Saving always returns the job to draft until the requirements are confirmed again.
export async function saveJob(recId, data, jobId = null) {
  const db = load();
  if (!recOf(db, recId)) fail('Recruiter not found.');
  const title = clean(data.title);
  if (!title) fail('Enter a job title.');
  if (!clean(data.description)) fail('Enter a job description.');
  const requiredSkills = catalogueSkills(db, data.requiredSkills);
  const preferredSkills = catalogueSkills(db, data.preferredSkills).filter((s) => !requiredSkills.includes(s));
  const fields = {
    title,
    description: clean(data.description),
    responsibilities: clean(data.responsibilities),
    location: clean(data.location),
    experience: clean(data.experience),
    requiredSkills,
    preferredSkills,
    requirementsFile: data.requirementsFile || null,
    requirementsText: String(data.requirementsText || '').slice(0, 20000),
  };
  let job;
  if (jobId) {
    job = ownJob(db, jobId, recId);
    Object.assign(job, fields, { confirmed: false, status: 'draft' });
  } else {
    job = { id: uid(), recruiterId: recId, ...fields, confirmed: false, status: 'draft', createdAt: new Date().toISOString(), postedAt: null };
    db.jobs.push(job);
  }
  save(db);
  return job;
}

const publish = (job) => {
  job.status = 'published';
  job.postedAt = new Date().toISOString();
};

export async function confirmRequirements(recId, jobId) {
  const db = load();
  const job = ownJob(db, jobId, recId);
  if (job.requiredSkills.length === 0) fail('Add at least one required skill before confirming.');
  job.confirmed = true;
  const approved = recOf(db, recId).approval.status === 'approved';
  if (approved) publish(job);
  save(db);
  return { published: approved };
}

export async function setJobStatus(recId, jobId, status) {
  const db = load();
  const job = ownJob(db, jobId, recId);
  if (status === 'published') {
    if (!job.confirmed) fail('Confirm the requirements first.');
    if (recOf(db, recId).approval.status !== 'approved') fail('Your company must be approved before you can publish a job.');
    publish(job);
  } else if (status === 'closed') {
    if (job.status !== 'published') fail('Only published jobs can be closed.');
    job.status = 'closed';
  } else fail('Unknown status.');
  save(db);
}

export async function deleteJob(recId, jobId) {
  const db = load();
  const job = ownJob(db, jobId, recId);
  if (job.status === 'published') fail('Close the job before deleting it.');
  db.jobs = db.jobs.filter((j) => j.id !== jobId);
  db.applications = db.applications.filter((a) => a.jobId !== jobId);
  db.decisions = db.decisions.filter((d) => d.jobId !== jobId);
  save(db);
}

// ---------- recruiter: shortlist and decisions ----------
export async function listDecisions(recId) {
  const db = load();
  const ids = new Set(db.jobs.filter((j) => j.recruiterId === recId).map((j) => j.id));
  return db.decisions.filter((d) => ids.has(d.jobId));
}

const syncApplication = (db, jobId, devId, status) => {
  const app = db.applications.find((a) => a.jobId === jobId && a.developerId === devId);
  if (app) app.status = status;
};

export async function shortlistCandidate(recId, jobId, devId) {
  const db = load();
  const job = ownJob(db, jobId, recId);
  if (job.status !== 'published') fail('Publish the job before shortlisting candidates.');
  const dev = db.developers.find((d) => d.id === devId);
  if (!dev) fail('Developer not found.');
  if (db.decisions.some((d) => d.jobId === jobId && d.developerId === devId)) fail('This candidate is already shortlisted.');
  db.decisions.push({ id: uid(), jobId, developerId: devId, status: 'shortlisted', decidedAt: new Date().toISOString() });
  syncApplication(db, jobId, devId, 'shortlisted');
  save(db);
}

// Selected / Rejected: updates the status and sends a notification to the developer.
export async function decideCandidate(recId, jobId, devId, decision) {
  const db = load();
  const job = ownJob(db, jobId, recId);
  if (!['selected', 'rejected'].includes(decision)) fail('Unknown decision.');
  const entry = db.decisions.find((d) => d.jobId === jobId && d.developerId === devId);
  if (!entry) fail('Shortlist the candidate first.');
  if (entry.status !== 'shortlisted') fail('A decision was already sent to this candidate.');
  const company = recOf(db, recId).companyName;
  entry.status = decision;
  entry.decidedAt = new Date().toISOString();
  syncApplication(db, jobId, devId, decision);
  db.notifications.push({
    id: uid(),
    developerId: devId,
    jobId,
    type: decision === 'selected' ? 'Selected' : 'Rejected',
    message:
      decision === 'selected'
        ? `Good news! ${company} selected you for ${job.title}.`
        : `${company} has decided not to move forward with your application for ${job.title}.`,
    sentAt: new Date().toISOString(),
    read: false,
  });
  save(db);
}
