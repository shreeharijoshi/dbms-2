import { createPlan, deletePlan, getPlan, getPlanFilters, getPlans, updatePlan } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { planForm } from "./plan-form.js";
import { planTable } from "../pages/membership-plans.js";

let currentPage = 0;
let total = 0;
let debounceTimer;
let activeLoad = 0;

function modalRoot() {
  let root = document.querySelector("#plan-dialog-root");
  if (!root) { root = document.createElement("div"); root.id = "plan-dialog-root"; document.body.append(root); }
  return root;
}

function showModal(markup) {
  const root = modalRoot();
  root.innerHTML = markup;
  root.querySelector("input:not([readonly]), select")?.focus();
}

async function refreshPlans() {
  const root = document.querySelector("#plans-page");
  if (!root) return;
  const requestId = ++activeLoad;
  const results = root.querySelector("#plan-results");
  const count = root.querySelector("#plan-count");
  results.innerHTML = `<div class="member-loading"><span class="member-spinner"></span>Loading membership plans…</div>`;
  count.textContent = "Loading plans…";
  try {
    const result = await getPlans({ search: root.querySelector("#plan-search").value.trim(), duration: root.querySelector("#plan-duration").value, skip: currentPage * 100, limit: 100 });
    if (requestId !== activeLoad || !root.isConnected) return;
    total = result.total;
    count.textContent = `${total} ${total === 1 ? "plan" : "plans"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${planTable(result.items)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="plan-page-prev" ${currentPage === 0 ? "disabled" : ""}>Previous</button><span>Page ${currentPage + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="plan-page-next" ${currentPage + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== activeLoad || !root.isConnected) return;
    count.textContent = "Plans unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load plans</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-plans">Try again</button></div>`;
  }
}

export async function mountPlansPage() {
  const root = document.querySelector("#plans-page");
  if (!root) return;
  currentPage = 0;
  const requestId = ++activeLoad;
  try {
    const filters = await getPlanFilters();
    if (requestId !== activeLoad || !root.isConnected) return;
    root.querySelector("#plan-duration").insertAdjacentHTML("beforeend", filters.durations.map((duration) => `<option value="${escapeHtml(duration)}">${escapeHtml(duration)} ${Number(duration) === 1 ? "month" : "months"}</option>`).join(""));
  } catch (error) {
    root.querySelector("#plan-results").innerHTML = `<div class="member-state member-error"><strong>Unable to load plan filters</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-plans">Try again</button></div>`;
    return;
  }
  await refreshPlans();
}

export function handlePlanClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "add-plan") showModal(planForm());
  if (action === "edit-plan") {
    getPlan(control.dataset.planId).then((plan) => showModal(planForm(plan))).catch((error) => showModal(`<div class="member-modal-backdrop"><section class="member-modal"><p class="member-form-feedback">${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="close-plan-modal">Close</button></section></div>`));
  }
  if (action === "close-plan-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().innerHTML = "";
  if (action === "delete-plan") {
    const planId = control.dataset.planId;
    if (window.confirm(`Delete plan ${planId}? Plans referenced by subscriptions or payment history cannot be deleted.`)) {
      control.disabled = true;
      deletePlan(planId).then(mountPlansPage).catch((error) => { window.alert(error.message); control.disabled = false; });
    }
  }
  if (action === "retry-plans") mountPlansPage();
  if (action === "reset-plan-filters") {
    document.querySelector("#plan-search").value = "";
    document.querySelector("#plan-duration").value = "";
    currentPage = 0;
    mountPlansPage();
  }
  if (action === "plan-page-prev" && currentPage > 0) { currentPage -= 1; refreshPlans(); }
  if (action === "plan-page-next" && (currentPage + 1) * 100 < total) { currentPage += 1; refreshPlans(); }
}

export function handlePlanInput(event) {
  if (!event.target.matches("#plan-search")) return;
  currentPage = 0;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshPlans, 250);
}

export function handlePlanChange(event) {
  if (event.target.matches("#plan-duration")) { currentPage = 0; refreshPlans(); }
}

export async function handlePlanSubmit(event) {
  const form = event.target;
  if (!form.matches("#plan-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  data.duration = Number(data.duration);
  data.price = Number(data.price);
  data.group_discount = Number(data.group_discount);
  data.seasonal_discount = Number(data.seasonal_discount);
  if (form.dataset.planId) delete data.plan_id;
  const feedback = form.querySelector(".member-form-feedback");
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.querySelector("span").textContent = "Saving…";
  feedback.textContent = "";
  try {
    if (form.dataset.planId) await updatePlan(form.dataset.planId, data);
    else await createPlan(data);
    modalRoot().innerHTML = "";
    await mountPlansPage();
  } catch (error) {
    feedback.textContent = error.message;
    submit.disabled = false;
    submit.querySelector("span").textContent = form.dataset.planId ? "Save changes" : "Add plan";
  }
}

export function closePlanDialogOnEscape(event) { if (event.key === "Escape") modalRoot().innerHTML = ""; }
