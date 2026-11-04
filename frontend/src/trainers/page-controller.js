import { createTrainer, deleteTrainer, getAssignedMembers, getTrainer, getTrainerFilters, getTrainers, updateTrainer } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { trainerForm } from "./trainer-form.js";
import { trainerDetailsPage, trainerListResult } from "../pages/trainers.js";

let filterOptions = { specialities: [], shifts: [] };
let currentPage = 0;
let total = 0;
let debounceTimer;
let activeLoad = 0;

function modalRoot() {
  let root = document.querySelector("#trainer-dialog-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "trainer-dialog-root";
    document.body.append(root);
  }
  return root;
}

function showModal(markup) {
  const root = modalRoot();
  root.innerHTML = markup;
  root.querySelector("input:not([readonly]), select")?.focus();
}

function showDeleteConfirmation(employeeId) {
  const name = document.querySelector(".member-detail-heading h1")?.textContent || employeeId;
  showModal(`<div class="member-modal-backdrop" data-action="close-trainer-modal"><section class="member-modal member-delete-modal" role="dialog" aria-modal="true" aria-labelledby="trainer-delete-title"><header class="member-modal-head"><div><span class="member-eyebrow">REMOVE TRAINER</span><h2 id="trainer-delete-title">Delete ${escapeHtml(name)}?</h2></div><button class="member-modal-close" type="button" data-action="close-trainer-modal" aria-label="Close">×</button></header><p class="member-delete-copy">A trainer cannot be deleted while members, expense history or a trainer login account still depend on this record.</p><p class="member-form-feedback" role="alert" aria-live="polite"></p><footer class="member-modal-actions"><button class="member-button member-button-muted" type="button" data-action="close-trainer-modal">Cancel</button><button class="member-button member-button-danger" type="button" data-action="confirm-trainer-delete" data-employee-id="${escapeHtml(employeeId)}">Delete trainer</button></footer></section></div>`);
}

async function refreshList() {
  const root = document.querySelector("#trainers-page:not([data-employee-id])");
  if (!root) return;
  const requestId = ++activeLoad;
  const result = root.querySelector("#trainer-results");
  const count = root.querySelector("#trainer-count");
  result.innerHTML = `<div class="member-loading"><span class="member-spinner"></span>Loading trainers…</div>`;
  count.textContent = "Loading trainers…";
  const filters = {
    search: root.querySelector("#trainer-search").value.trim(),
    speciality: root.querySelector("#trainer-speciality").value,
    shift: root.querySelector("#trainer-shift").value,
    skip: currentPage * 100,
    limit: 100,
  };
  try {
    const response = await getTrainers(filters);
    if (requestId !== activeLoad || !root.isConnected) return;
    total = response.total;
    count.textContent = `${total} ${total === 1 ? "trainer" : "trainers"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    result.innerHTML = `${trainerListResult(response.items)}${total > 100 ? `<nav class="member-pagination" aria-label="Trainer pages"><button class="member-button member-button-muted" data-action="trainer-page-prev" ${currentPage === 0 ? "disabled" : ""}>Previous</button><span>Page ${currentPage + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="trainer-page-next" ${currentPage + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== activeLoad || !root.isConnected) return;
    count.textContent = "Trainers unavailable";
    result.innerHTML = `<div class="member-state member-error"><strong>Unable to load trainers</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-trainers">Try again</button></div>`;
  }
}

function addOptions(select, values) {
  select.insertAdjacentHTML("beforeend", values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join(""));
}

export async function mountTrainerPage() {
  const root = document.querySelector("#trainers-page");
  if (!root) return;
  const requestId = ++activeLoad;
  if (root.dataset.employeeId) {
    try {
      const [trainer, members] = await Promise.all([
        getTrainer(root.dataset.employeeId),
        getAssignedMembers(root.dataset.employeeId),
      ]);
      if (requestId !== activeLoad || !root.isConnected) return;
      root.outerHTML = trainerDetailsPage(trainer, members);
    } catch (error) {
      if (requestId !== activeLoad || !root.isConnected) return;
      root.innerHTML = `<div class="member-state member-error"><strong>Unable to load this trainer</strong><p>${escapeHtml(error.message)}</p><a class="member-back-link" href="#/admin/trainers">←&nbsp; Back to trainers</a></div>`;
    }
    return;
  }
  currentPage = 0;
  try {
    filterOptions = await getTrainerFilters();
    if (requestId !== activeLoad || !root.isConnected) return;
    addOptions(root.querySelector("#trainer-speciality"), filterOptions.specialities || []);
    addOptions(root.querySelector("#trainer-shift"), filterOptions.shifts || []);
  } catch (error) {
    root.querySelector("#trainer-results").innerHTML = `<div class="member-state member-error"><strong>Unable to load trainer filters</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-trainers">Try again</button></div>`;
    return;
  }
  await refreshList();
}

export function handleTrainerClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action } = control.dataset;
  if (action === "add-trainer") showModal(trainerForm());
  if (action === "edit-trainer") {
    getTrainer(control.dataset.employeeId)
      .then((trainer) => showModal(trainerForm(trainer)))
      .catch((error) => showModal(`<div class="member-modal-backdrop"><section class="member-modal" role="alert"><p class="member-form-feedback">${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="close-trainer-modal">Close</button></section></div>`));
  }
  if (action === "close-trainer-modal" && (event.target === control || control.classList.contains("member-modal-close"))) modalRoot().innerHTML = "";
  if (action === "delete-trainer") showDeleteConfirmation(control.dataset.employeeId);
  if (action === "confirm-trainer-delete") {
    control.disabled = true;
    control.textContent = "Deleting…";
    deleteTrainer(control.dataset.employeeId).then(() => {
      modalRoot().innerHTML = "";
      window.location.hash = "#/admin/trainers";
    }).catch((error) => {
      control.disabled = false;
      control.textContent = "Delete trainer";
      const feedback = modalRoot().querySelector(".member-form-feedback");
      if (feedback) feedback.textContent = error.message;
    });
  }
  if (action === "retry-trainers") mountTrainerPage();
  if (action === "reset-trainer-filters") {
    document.querySelector("#trainer-search").value = "";
    document.querySelector("#trainer-speciality").value = "";
    document.querySelector("#trainer-shift").value = "";
    currentPage = 0;
    refreshList();
  }
  if (action === "trainer-page-prev" && currentPage > 0) { currentPage -= 1; refreshList(); }
  if (action === "trainer-page-next" && (currentPage + 1) * 100 < total) { currentPage += 1; refreshList(); }
}

export function handleTrainerInput(event) {
  if (!event.target.matches("#trainer-search")) return;
  currentPage = 0;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshList, 250);
}

export function handleTrainerChange(event) {
  if (!event.target.matches("#trainer-speciality, #trainer-shift")) return;
  currentPage = 0;
  refreshList();
}

export async function handleTrainerSubmit(event) {
  const form = event.target;
  if (!form.matches("#trainer-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const feedback = form.querySelector(".member-form-feedback");
  const data = Object.fromEntries(new FormData(form).entries());
  data.height = Number(data.height);
  data.weight = Number(data.weight);
  if (form.dataset.employeeId) delete data.employee_id;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.querySelector("span").textContent = "Saving…";
  feedback.textContent = "";
  try {
    if (form.dataset.employeeId) await updateTrainer(form.dataset.employeeId, data);
    else await createTrainer(data);
    modalRoot().innerHTML = "";
    if (window.location.hash.startsWith("#/admin/trainers/")) window.location.hash = "#/admin/trainers";
    else refreshList();
  } catch (error) {
    feedback.textContent = error.message;
    submit.disabled = false;
    submit.querySelector("span").textContent = form.dataset.employeeId ? "Save changes" : "Add trainer";
  }
}

export function closeTrainerDialogOnEscape(event) {
  if (event.key === "Escape") modalRoot().innerHTML = "";
}
