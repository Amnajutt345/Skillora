export const PROFILE_FIELDS = ['fullName', 'title', 'location', 'contact', 'education', 'experience', 'bio'];

// Share of profile fields that are filled in (plus at least one skill).
export function profileCompletion(profile) {
  const filled = PROFILE_FIELDS.filter((f) => String(profile[f] || '').trim()).length + (profile.skills?.length ? 1 : 0);
  return Math.round((filled / (PROFILE_FIELDS.length + 1)) * 100);
}
