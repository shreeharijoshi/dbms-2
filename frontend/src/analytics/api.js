import { getAccessToken } from "../auth/store.js";

const API_BASE = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || "Analytics request failed");
  return payload;
}

export function getAnalytics() {
  return request("/admin/analytics/dashboard?months=12");
}

export function getReport(type, dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const suffix = params.size ? `?${params}` : "";
  return request(`/admin/analytics/reports/${encodeURIComponent(type)}${suffix}`);
}
