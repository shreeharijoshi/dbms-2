const STORAGE_KEY = "ironcore.auth.session";
let inMemorySession = null;
let authNotice = "";

function readSession() {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (value) return JSON.parse(value);
  } catch {
    // Keep the active session in memory if browser storage is unavailable.
  }
  return inMemorySession;
}

export function getAccessToken() {
  const session = readSession();
  return typeof session?.access_token === "string" ? session.access_token : null;
}

export function getStoredUser() {
  return readSession()?.user || null;
}

export function saveSession(session) {
  inMemorySession = session;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The token remains available in memory for this page session.
  }
}

export function updateStoredUser(user) {
  const session = readSession();
  if (session?.access_token) saveSession({ ...session, user });
}

export function clearSession() {
  inMemorySession = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // There is no persistent session to clear when storage is unavailable.
  }
}

export function setAuthNotice(message) {
  authNotice = message;
}

export function takeAuthNotice() {
  const message = authNotice;
  authNotice = "";
  return message;
}
