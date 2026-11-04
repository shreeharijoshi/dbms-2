import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API_BASE_URL = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class TrainerApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "TrainerApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new TrainerApiError("Your session has expired. Please sign in again.", 401);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    throw new TrainerApiError("Unable to reach the trainer service. Check that the API is running.", 0);
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
    throw new TrainerApiError(detail || "The request could not be completed. Try again.", response.status);
  }
  return data;
}

export function getTrainers(filters = {}) {
  const query = new URLSearchParams();
  for (const key of ["search", "speciality", "shift", "skip", "limit"]) {
    if (filters[key] !== undefined && filters[key] !== "") query.set(key, filters[key]);
  }
  return request(`/trainers${query.toString() ? `?${query}` : ""}`);
}

export const getTrainer = (id) => request(`/trainers/${encodeURIComponent(id)}`);
export const getTrainerFilters = () => request("/trainers/filters");
export const getAssignedMembers = (id) => request(`/trainers/${encodeURIComponent(id)}/members`);
export const createTrainer = (data) => request("/trainers", { method: "POST", body: JSON.stringify(data) });
export const updateTrainer = (id, data) => request(`/trainers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTrainer = (id) => request(`/trainers/${encodeURIComponent(id)}`, { method: "DELETE" });
