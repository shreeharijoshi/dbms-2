const API_BASE_URL = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class MembershipPlanApiError extends Error {
  constructor(message, status) { super(message); this.name = "MembershipPlanApiError"; this.status = status; }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new MembershipPlanApiError("Unable to reach the membership plan service.", 0);
  }
  let data = {};
  try { data = await response.json(); } catch { /* use status fallback */ }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail;
    throw new MembershipPlanApiError(detail || "The request could not be completed.", response.status);
  }
  return data;
}

export function getPlans(filters = {}) {
  const query = new URLSearchParams();
  for (const key of ["search", "duration", "skip", "limit"]) {
    if (filters[key] !== undefined && filters[key] !== "") query.set(key, filters[key]);
  }
  return request(`/membership-plans${query.toString() ? `?${query}` : ""}`);
}

export const getPlanFilters = () => request("/membership-plans/filters");
export const getPlan = (id) => request(`/membership-plans/${encodeURIComponent(id)}`);
export const createPlan = (data) => request("/membership-plans", { method: "POST", body: JSON.stringify(data) });
export const updatePlan = (id, data) => request(`/membership-plans/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePlan = (id) => request(`/membership-plans/${encodeURIComponent(id)}`, { method: "DELETE" });
