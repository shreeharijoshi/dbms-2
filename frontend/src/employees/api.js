const API = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options.headers } }); }
  catch { throw new Error("Unable to reach the employee service. Check that the API is running."); }
  let data = {};
  try { data = await response.json(); } catch { /* empty response */ }
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(" ") : data.detail || "The request could not be completed.");
  return data;
}
function query(filters = {}) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "" && value !== null) params.set(key, value); return params.toString(); }
export const getEmployees = (filters = {}) => request(`/miscellaneous-employees${query(filters) ? `?${query(filters)}` : ""}`);
export const getEmployeeFilters = () => request("/miscellaneous-employees/filters");
export const getEmployee = (id) => request(`/miscellaneous-employees/${encodeURIComponent(id)}`);
export const createEmployee = (data) => request("/miscellaneous-employees", { method: "POST", body: JSON.stringify(data) });
export const updateEmployee = (id, data) => request(`/miscellaneous-employees/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEmployee = (id) => request(`/miscellaneous-employees/${encodeURIComponent(id)}`, { method: "DELETE" });
