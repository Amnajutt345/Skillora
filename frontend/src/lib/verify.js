// Compares a developer's claimed skills with the evidence found on GitHub.
// status: 'verified' | 'not_found' | 'not_analyzed'

export function evidenceFor(analysis, skill) {
  if (!analysis) return null;
  const key = Object.keys(analysis.evidence).find((k) => k.toLowerCase() === skill.toLowerCase());
  return key ? analysis.evidence[key] : [];
}

export function verificationRows(dev) {
  return (dev.skills || []).map((skill) => {
    const ev = evidenceFor(dev.analysis, skill);
    return {
      skill,
      evidence: ev || [],
      status: ev === null ? 'not_analyzed' : ev.length ? 'verified' : 'not_found',
    };
  });
}

export const EVIDENCE_LABEL = { language: 'Language', library: 'Library', topic: 'Topic' };
