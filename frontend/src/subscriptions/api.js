import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API_BASE_URL = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class SubscriptionApiError extends Error {
  constructor(message, status) { super(message); this.name = "SubscriptionApiError"; this.status = status; }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new SubscriptionApiError("Your session has expired. Please sign in again.", 401);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    throw new SubscriptionApiError("Unable to reach the subscription service.", 0);
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
    throw new SubscriptionApiError(detail || "The request could not be completed.", response.status);
  }
  return data;
}

export function getSubscriptions(filters = {}) {
  const query = new URLSearchParams();
  for (const key of ["search", "status", "skip", "limit"]) {
    if (filters[key] !== undefined && filters[key] !== "") query.set(key, filters[key]);
  }
  return request(`/subscriptions${query.toString() ? `?${query}` : ""}`);
}

export function getExpiringSubscriptions(filters = {}) {
  const query = new URLSearchParams({ skip: String(filters.skip || 0), limit: String(filters.limit || 100) });
  if (filters.search) query.set("search", filters.search);
  return request(`/subscriptions/expiring?${query}`);
}

export function getMemberSubscriptions(memberId, filters = {}) {
  const query = new URLSearchParams({ skip: String(filters.skip || 0), limit: String(filters.limit || 100) });
  if (filters.search) query.set("search", filters.search);
  return request(`/subscriptions/member/${encodeURIComponent(memberId)}?${query}`);
}

export const getSubscriptionOptions = () => request("/subscriptions/options");
export const enrollMember = (data) => request("/subscriptions", { method: "POST", body: JSON.stringify(data) });
export const renewSubscription = (id, planId) => request(`/subscriptions/${encodeURIComponent(id)}/renew`, { method: "POST", body: JSON.stringify({ plan_id: planId || null }) });
export const updateSubscriptionStatus = (id, membershipStatus) => request(`/subscriptions/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ membership_status: membershipStatus }) });
export const deleteSubscription = (id) => request(`/subscriptions/${encodeURIComponent(id)}`, { method: "DELETE" });
