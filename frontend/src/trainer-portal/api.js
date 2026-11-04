import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path) {
  const token = getAccessToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  let response;
  try { response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new Error("Unable to reach the trainer workspace. Check that the API is running."); }
  let data = {};
  try { data = await response.json(); } catch { /* empty response */ }
  if (response.status === 401) { clearSession(); setAuthNotice("Your session has expired. Please sign in again."); window.location.hash = "#/login"; }
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}

export const getTrainerOverview = () => request("/trainer-portal/overview");
export const getTrainerMembers = ({ search = "", skip = 0, limit = 100 } = {}) => {
  const query = new URLSearchParams({ skip, limit });
  if (search) query.set("search", search);
  return request(`/trainer-portal/members?${query}`);
};
export const getTrainerMember = (id) => request(`/trainer-portal/members/${encodeURIComponent(id)}`);
export const getTrainerPortalProfile = () => request("/trainer-portal/profile");
