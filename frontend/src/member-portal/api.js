import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } }); }
  catch { throw new Error("Unable to reach your member workspace. Check that the API is running."); }
  let data = {};
  try { data = await response.json(); } catch { /* empty response */ }
  if (response.status === 401) { clearSession(); setAuthNotice("Your session has expired. Please sign in again."); window.location.hash = "#/login"; }
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}

export const getMemberOverview = () => request("/member-portal/overview");
export const getMemberProfile = () => request("/member-portal/profile");
export const updateMemberContact = (contact) => request("/member-portal/profile", { method: "PATCH", body: JSON.stringify({ contact }) });
export const getMemberMemberships = () => request("/member-portal/membership");
export const getMemberPayments = ({ skip = 0, limit = 100 } = {}) => request(`/member-portal/payments?${new URLSearchParams({ skip, limit })}`);
export const getMemberPayment = (id) => request(`/member-portal/payments/${encodeURIComponent(id)}`);
export const getAssignedTrainer = () => request("/member-portal/trainer");
