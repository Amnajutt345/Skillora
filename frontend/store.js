// Browser storage layer. Everything is kept in localStorage for now.
// Replace the functions in api.js with fetch() calls to the FastAPI backend later.

const KEY = 'skillora_db_v1';
const SESSION = 'skillora_session';

const COLLECTIONS = ['users', 'developers', 'recruiters', 'jobs', 'applications', 'notifications', 'decisions', 'skills'];

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function emptyDatabase() {
  return Object.fromEntries(COLLECTIONS.map((collection) => [collection, []]));
}

export function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyDatabase();

  let db;
  try {
    db = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Skillora data could not be read from browser storage. Existing data was left unchanged. ${error.message}`);
  }

  if (!db || typeof db !== 'object' || Array.isArray(db)) {
    throw new Error('Skillora data in browser storage has an invalid format. Existing data was left unchanged.');
  }

  COLLECTIONS.forEach((collection) => {
    if (db[collection] === undefined) db[collection] = [];
    else if (!Array.isArray(db[collection])) {
      throw new Error(`Skillora ${collection} data in browser storage has an invalid format. Existing data was left unchanged.`);
    }
  });
  return db;
}

export const getSession = () => localStorage.getItem(SESSION);
export const setSession = (id) => localStorage.setItem(SESSION, id);
export const clearSession = () => localStorage.removeItem(SESSION);
