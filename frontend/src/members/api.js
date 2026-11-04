import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API_BASE_URL = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class MemberApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MemberApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new MemberApiError("Your session has expired. Please sign in again.", 401);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    throw new MemberApiError("Unable to reach the member service. Check that the API is running.", 0);
  }
  let data = {};
  try { data = await response.json(); } catch { /* use status fallback */ }
  if (response.status === 401) {
    clearSession();
    setAuthNotice("Your session has expired. Please sign in again.");
    window.location.hash = "#/login";
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail;
    throw new MemberApiError(detail || "The request could not be completed. Try again.", response.status);
  }
  return data;
}

export function getMembers(filters = {}) {
  const query = new URLSearchParams();
  for (const key of ["search", "gender", "trainer_id", "skip", "limit"]) {
    if (filters[key] !== undefined && filters[key] !== "") query.set(key, filters[key]);
  }
  return request(`/members${query.size ? `?${query}` : ""}`);
}

export const getMember = (id) => request(`/members/${encodeURIComponent(id)}`);
export const getMemberFilters = () => request("/members/filters");
export const createMember = (data) => request("/members", { method: "POST", body: JSON.stringify(data) });
export const updateMember = (id, data) => request(`/members/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMember = (id) => request(`/members/${encodeURIComponent(id)}`, { method: "DELETE" });
