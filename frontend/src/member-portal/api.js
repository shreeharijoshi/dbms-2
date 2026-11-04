const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Unable to reach your member workspace. Check that the API is running.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}

const memberPath = (id, suffix = "") => `/member-portal/${encodeURIComponent(id)}${suffix}`;
export const getMemberOptions = () => request("/member-portal/options");
export const getMemberOverview = (id) => request(memberPath(id, "/overview"));
export const getMemberProfile = (id) => request(memberPath(id, "/profile"));
export const updateMemberContact = (id, contact) => request(memberPath(id, "/profile"), { method: "PATCH", body: JSON.stringify({ contact }) });
export const getMemberMemberships = (id) => request(memberPath(id, "/membership"));
export const getMemberPayments = (id, { skip = 0, limit = 100 } = {}) => request(`${memberPath(id, "/payments")}?${new URLSearchParams({ skip, limit })}`);
export const getMemberPayment = (memberId, paymentId) => request(`${memberPath(memberId, "/payments")}/${encodeURIComponent(paymentId)}`);
export const getAssignedTrainer = (id) => request(memberPath(id, "/trainer"));
