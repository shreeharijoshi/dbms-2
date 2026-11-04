import { createEmployee, deleteEmployee, getEmployee, getEmployeeFilters, getEmployees, updateEmployee } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { employeeForm, employeeTable } from "../pages/employees.js";

let page = 0;
let total = 0;
let timer;
let loading = 0;

function modalRoot() { let root = document.querySelector("#employee-dialog-root"); if (!root) { root = document.createElement("div"); root.id = "employee-dialog-root"; document.body.append(root); } return root; }

async function refresh() {
  const root = document.querySelector("#employees-page");
  if (!root) return;
  const requestId = ++loading;
  const results = root.querySelector("#employee-results");
  const count = root.querySelector("#employee-count");
  results.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading employees…</div>';
  try {
    const response = await getEmployees({ search: root.querySelector("#employee-search").value.trim(), role: root.querySelector("#employee-role").value, skip: page * 100, limit: 100 });
    if (requestId !== loading || !root.isConnected) return;
    total = response.total; count.textContent = `${total} ${total === 1 ? "employee" : "employees"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${employeeTable(response.items)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="employee-page-prev" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="employee-page-next" ${page + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== loading || !root.isConnected) return;
    count.textContent = "Employees unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load employees</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-employees">Try again</button></div>`;
  }
}

export async function mountEmployeesPage() {
  const root = document.querySelector("#employees-page");
  if (!root) return;
  page = 0; const requestId = ++loading;
  try {
    const filters = await getEmployeeFilters();
    if (requestId !== loading || !root.isConnected) return;
    root.querySelector("#employee-role").insertAdjacentHTML("beforeend", filters.roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`).join(""));
    await refresh();
  } catch (error) {
    if (!root.isConnected) return;
    root.querySelector("#employee-results").innerHTML = `<div class="member-state member-error"><strong>Unable to load employee filters</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-employees">Try again</button></div>`;
  }
}

export function handleEmployeeInput(event) {
  if (!event.target.matches("#employee-search")) return;
  page = 0; clearTimeout(timer); timer = setTimeout(refresh, 250);
}

export function handleEmployeeChange(event) { if (event.target.matches("#employee-role")) { page = 0; refresh(); } }

export async function handleEmployeeClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "add-employee") modalRoot().innerHTML = employeeForm();
  if (action === "close-employee-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().replaceChildren();
  if (action === "edit-employee") {
    control.disabled = true;
    try { modalRoot().innerHTML = employeeForm(await getEmployee(control.dataset.employeeId)); }
    catch (error) { window.alert(error.message); }
    finally { control.disabled = false; }
  }
  if (action === "delete-employee" && window.confirm(`Delete employee ${control.dataset.employeeId}? Employees with expense history cannot be deleted.`)) {
    control.disabled = true;
    deleteEmployee(control.dataset.employeeId).then(mountEmployeesPage).catch((error) => { window.alert(error.message); control.disabled = false; });
  }
  if (action === "retry-employees") mountEmployeesPage();
  if (action === "reset-employee-filters") {
    document.querySelector("#employee-search").value = ""; document.querySelector("#employee-role").value = ""; page = 0; refresh();
  }
  if (action === "employee-page-prev" && page > 0) { page -= 1; refresh(); }
  if (action === "employee-page-next" && (page + 1) * 100 < total) { page += 1; refresh(); }
}

export async function handleEmployeeSubmit(event) {
  const form = event.target;
  if (!form.matches("#employee-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector('[type="submit"]'); const feedback = form.querySelector(".member-form-feedback");
  submit.disabled = true; submit.querySelector("span").textContent = "Saving…"; feedback.textContent = "";
  try {
    if (form.dataset.employeeId) { delete data.employee_id; await updateEmployee(form.dataset.employeeId, data); }
    else await createEmployee(data);
    modalRoot().replaceChildren(); await mountEmployeesPage();
  } catch (error) { feedback.textContent = error.message; submit.disabled = false; submit.querySelector("span").textContent = form.dataset.employeeId ? "Save changes" : "Add employee"; }
}

export function closeEmployeeDialogOnEscape(event) { if (event.key === "Escape") modalRoot().replaceChildren(); }
