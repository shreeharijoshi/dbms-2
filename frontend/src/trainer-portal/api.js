const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Unable to reach the trainer workspace. Check that the API is running.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}

const trainerPath = (id, suffix = "") => `/trainer-portal/${encodeURIComponent(id)}${suffix}`;
export const getTrainerOptions = () => request("/trainer-portal/options");
export const getTrainerOverview = (id) => request(trainerPath(id, "/overview"));
export const getTrainerMembers = (id, { search = "", skip = 0, limit = 100 } = {}) => {
  const query = new URLSearchParams({ skip, limit });
  if (search) query.set("search", search);
  return request(`${trainerPath(id, "/members")}?${query}`);
};
export const getTrainerMember = (trainerId, memberId) => request(`${trainerPath(trainerId, "/members")}/${encodeURIComponent(memberId)}`);
export const getTrainerPortalProfile = (id) => request(trainerPath(id, "/profile"));
