import { createExpense, deleteExpense, getExpense, getExpenseOptions, getExpenses, updateExpense } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { expenseDetails, expenseForm, expenseTable } from "../pages/expenses.js";

let page = 0;
let total = 0;
let timer;
let loading = 0;
let options;

function modalRoot() {
  let root = document.querySelector("#expense-dialog-root");
  if (!root) { root = document.createElement("div"); root.id = "expense-dialog-root"; document.body.append(root); }
  return root;
}

async function refresh() {
  const root = document.querySelector("#expenses-page");
  if (!root) return;
  const requestId = ++loading;
  const results = root.querySelector("#expense-results");
  const count = root.querySelector("#expense-count");
  results.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading expenses…</div>';
  try {
    const filters = { search: root.querySelector("#expense-search").value.trim(), expense_type: root.querySelector("#expense-type-filter").value, date_from: root.querySelector("#expense-date-from").value, date_to: root.querySelector("#expense-date-to").value, skip: page * 100, limit: 100 };
    const response = await getExpenses(filters);
    if (requestId !== loading || !root.isConnected) return;
    total = response.total; count.textContent = `${total} ${total === 1 ? "expense" : "expenses"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${expenseTable(response.items)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="expense-page-prev" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="expense-page-next" ${page + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== loading || !root.isConnected) return;
    count.textContent = "Expenses unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load expenses</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-expenses">Try again</button></div>`;
  }
}

export function mountExpensesPage() { page = 0; return refresh(); }

export function handleExpenseInput(event) {
  if (!event.target.matches("#expense-search")) return;
  page = 0; clearTimeout(timer); timer = setTimeout(refresh, 250);
}

export function handleExpenseChange(event) {
  if (event.target.matches("#expense-type-filter, #expense-date-from, #expense-date-to")) { page = 0; refresh(); }
  if (event.target.matches("#expense-type-select")) updateAssociationOptions(event.target.value);
}

async function openForm(expense = null) {
  try {
    options = await getExpenseOptions();
    modalRoot().innerHTML = expenseForm(options, expense);
    modalRoot().querySelector("#expense-association")?.focus();
  } catch (error) { window.alert(error.message); }
}

function updateAssociationOptions(type) {
  const select = modalRoot().querySelector("#expense-association");
  const label = modalRoot().querySelector("#expense-association-label");
  if (!select || !label || !options) return;
  const previous = select.value;
  const choices = type === "Maintenance" ? options.inventory.map((row) => [row.inventory_id, row.item_name]) : [...options.trainers.map((row) => [row.employee_id, `${row.trainer_name} · Trainer`]), ...options.employees.map((row) => [row.employee_id, `${row.employee_name} · Employee`])];
  label.firstChild.textContent = type === "Maintenance" ? "Inventory item" : "Trainer or employee";
  select.innerHTML = `<option value="">Select ${type === "Maintenance" ? "inventory" : "staff"}</option>${choices.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)} · ${escapeHtml(id)}</option>`).join("")}`;
  if (choices.some(([id]) => id === previous)) select.value = previous;
}

export async function handleExpenseClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "add-expense") openForm();
  if (action === "close-expense-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().replaceChildren();
  if (action === "view-expense" || action === "edit-expense") {
    control.disabled = true;
    try {
      const item = await getExpense(control.dataset.expenseId);
      if (action === "view-expense") modalRoot().innerHTML = expenseDetails(item);
      else await openForm(item);
    } catch (error) { window.alert(error.message); }
    finally { control.disabled = false; }
  }
  if (action === "delete-expense") {
    if (window.confirm(`Delete expense ${control.dataset.expenseId}? This cannot be undone.`)) {
      control.disabled = true;
      deleteExpense(control.dataset.expenseId).then(refresh).catch((error) => { window.alert(error.message); control.disabled = false; });
    }
  }
  if (action === "retry-expenses") refresh();
  if (action === "reset-expense-filters") {
    const root = document.querySelector("#expenses-page");
    for (const selector of ["#expense-search", "#expense-type-filter", "#expense-date-from", "#expense-date-to"]) root.querySelector(selector).value = "";
    page = 0; refresh();
  }
  if (action === "expense-page-prev" && page > 0) { page -= 1; refresh(); }
  if (action === "expense-page-next" && (page + 1) * 100 < total) { page += 1; refresh(); }
}

export async function handleExpenseSubmit(event) {
  const form = event.target;
  if (!form.matches("#expense-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const assoc = modalRoot().querySelector("#expense-association").value;
  data.trainer_id = data.misc_employee_id = data.inventory_id = null;
  if (data.expense_type === "Maintenance") data.inventory_id = assoc;
  else if (options.trainers.some((item) => item.employee_id === assoc)) data.trainer_id = assoc;
  else data.misc_employee_id = assoc;
  data.amount = Number(data.amount); data.bonus = Number(data.bonus);
  data.expense_month = data.expense_month ? `${data.expense_month}-01` : null; data.remarks = data.remarks || null;
  const submit = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".member-form-feedback");
  submit.disabled = true; submit.querySelector("span").textContent = "Saving…"; feedback.textContent = "";
  try {
    if (form.dataset.expenseId) await updateExpense(form.dataset.expenseId, data);
    else await createExpense(data);
    modalRoot().replaceChildren(); await refresh();
  } catch (error) { feedback.textContent = error.message; submit.disabled = false; submit.querySelector("span").textContent = form.dataset.expenseId ? "Save changes" : "Record expense"; }
}

export function closeExpenseDialogOnEscape(event) { if (event.key === "Escape") modalRoot().replaceChildren(); }
