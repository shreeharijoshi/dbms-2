import { getMemberOptions } from "../member-portal/api.js";
import { getTrainerOptions } from "../trainer-portal/api.js";

const keys = { trainer: "ironcore.workspace.trainer", member: "ironcore.workspace.member" };

export function selectedWorkspaceRecord(role) {
  try { return window.localStorage.getItem(keys[role]) || ""; }
  catch { return ""; }
}

export function saveWorkspaceRecord(role, id) {
  try {
    if (id) window.localStorage.setItem(keys[role], id);
    else window.localStorage.removeItem(keys[role]);
  } catch { /* the selection remains available until the next page render */ }
}

export async function mountWorkspaceSelector(role) {
  const select = document.querySelector("#workspace-record-select");
  if (!select || !keys[role]) return;
  const saved = selectedWorkspaceRecord(role);
  try {
    const options = role === "trainer" ? await getTrainerOptions() : await getMemberOptions();
    const idKey = role === "trainer" ? "employee_id" : "member_id";
    const nameKey = role === "trainer" ? "trainer_name" : "member_name";
    select.innerHTML = `<option value="">Choose ${role} record</option>${options.map((item) => `<option value="${escapeHtml(item[idKey])}">${escapeHtml(item[nameKey] || item[idKey])} · ${escapeHtml(item[idKey])}</option>`).join("")}`;
    const validSaved = options.some((item) => item[idKey] === saved);
    if (saved && !validSaved) saveWorkspaceRecord(role, "");
    select.value = validSaved ? saved : "";
  } catch (error) {
    select.innerHTML = `<option value="">Records unavailable: ${escapeHtml(error.message)}</option>`;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
