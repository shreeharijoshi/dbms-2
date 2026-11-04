import { clearSession, getAccessToken, setAuthNotice } from "../auth/store.js";

const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
  } catch { throw new Error("Unable to reach the payment service. Check that the API is running."); }
  let data = {};
  try { data = await response.json(); } catch { /* empty response */ }
  if (response.status === 401) { clearSession(); setAuthNotice("Your session has expired. Please sign in again."); window.location.hash = "#/login"; }
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}

function query(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "" && value !== null) params.set(key, value);
  return params.toString();
}

export const getPayments = (filters = {}) => request(`/payments${query(filters) ? `?${query(filters)}` : ""}`);
export const getMemberPayments = (id, filters = {}) => request(`/payments/member/${encodeURIComponent(id)}${query(filters) ? `?${query(filters)}` : ""}`);
export const getPayment = (id) => request(`/payments/${encodeURIComponent(id)}`);
export const getPaymentOptions = () => request("/payments/options");
export const createPayment = (data) => request("/payments", { method: "POST", body: JSON.stringify(data) });
