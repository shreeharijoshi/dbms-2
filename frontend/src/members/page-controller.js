import { createMember, deleteMember, getMember, getMemberFilters, getMembers, updateMember } from "./api.js";
import { escapeHtml } from "./html.js";
import { memberForm } from "./member-form.js";
import { memberDetailsPage, memberListResult } from "../pages/members.js";

let trainers = [];
let currentPage = 0;
let total = 0;
let debounceTimer;
let activeLoad = 0;

function modalRoot() {
  let root = document.querySelector("#member-dialog-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "member-dialog-root";
    document.body.append(root);
  }
  return root;
}

function showModal(html) {
  const root = modalRoot();
  root.innerHTML = html;
  root.querySelector("input:not([readonly]), select")?.focus();
}

function showDeleteConfirmation(memberId) {
  const memberName = document.querySelector(".member-detail-heading h1")?.textContent;
  showModal(`<div class="member-modal-backdrop" data-action="close-member-modal"><section class="member-modal member-delete-modal" role="dialog" aria-modal="true" aria-labelledby="member-delete-title"><header class="member-modal-head"><div><span class="member-eyebrow">REMOVE MEMBER</span><h2 id="member-delete-title">Delete ${escapeHtml(memberName || memberId)}?</h2></div><button class="member-modal-close" type="button" data-action="close-member-modal" aria-label="Close">×</button></header><p class="member-delete-copy">This permanently removes the member profile. Members with membership or payment records cannot be deleted.</p><p class="member-form-feedback" role="alert" aria-live="polite"></p><footer class="member-modal-actions"><button class="member-button member-button-muted" type="button" data-action="close-member-modal">Cancel</button><button class="member-button member-button-danger" type="button" data-action="confirm-member-delete" data-member-id="${escapeHtml(memberId)}">Delete member</button></footer></section></div>`);
}

async function refreshList() {
  const root = document.querySelector("#members-page:not([data-member-id])");
  if (!root) return;
  const requestId = ++activeLoad;
  const result = root.querySelector("#member-results");
  const count = root.querySelector("#member-count");
  result.innerHTML = `<div class="member-loading"><span class="member-spinner"></span>Loading members…</div>`;
  count.textContent = "Loading members…";
  const filters = {
    search: root.querySelector("#member-search").value.trim(),
    gender: root.querySelector("#member-gender").value,
    trainer_id: root.querySelector("#member-trainer").value,
    skip: currentPage * 100,
    limit: 100,
  };
  try {
    const response = await getMembers(filters);
    if (requestId !== activeLoad || !root.isConnected) return;
    total = response.total;
    count.textContent = `${total} ${total === 1 ? "member" : "members"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    result.innerHTML = `${memberListResult(response.items)}${total > 100 ? `<nav class="member-pagination" aria-label="Member pages"><button class="member-button member-button-muted" data-action="member-page-prev" ${currentPage === 0 ? "disabled" : ""}>Previous</button><span>Page ${currentPage + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="member-page-next" ${currentPage + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== activeLoad || !root.isConnected) return;
    count.textContent = "Members unavailable";
    result.innerHTML = `<div class="member-state member-error"><strong>Unable to load members</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-members">Try again</button></div>`;
  }
}

export async function mountMemberPage() {
  const root = document.querySelector("#members-page");
  if (!root) return;
  const requestId = ++activeLoad;
  if (root.dataset.memberId) {
    try {
      const options = await getMemberFilters();
      trainers = options.trainers || [];
      const member = await getMember(root.dataset.memberId);
      if (requestId !== activeLoad || !root.isConnected) return;
      root.outerHTML = memberDetailsPage(member);
    } catch (error) {
      if (requestId !== activeLoad || !root.isConnected) return;
      root.innerHTML = `<div class="member-state member-error"><strong>Unable to load this member</strong><p>${escapeHtml(error.message)}</p><a class="member-back-link" href="#/admin/members">←&nbsp; Back to members</a></div>`;
    }
    return;
  }
  currentPage = 0;
  try {
    const options = await getMemberFilters();
    if (requestId !== activeLoad || !root.isConnected) return;
    trainers = options.trainers || [];
    root.querySelector("#member-trainer").insertAdjacentHTML("beforeend", trainers.map((trainer) => `<option value="${escapeHtml(trainer.employee_id)}">${escapeHtml(trainer.trainer_name || trainer.employee_id)}</option>`).join(""));
  } catch (error) {
    const result = root.querySelector("#member-results");
    if (result) result.innerHTML = `<div class="member-state member-error"><strong>Unable to load member filters</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-members">Try again</button></div>`;
    return;
  }
  await refreshList();
}

export function handleMemberClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action } = control.dataset;
  if (action === "add-member") showModal(memberForm(null, trainers));
  if (action === "edit-member") {
    getMember(control.dataset.memberId).then((member) => showModal(memberForm(member, trainers))).catch((error) => showModal(`<div class="member-modal-backdrop"><section class="member-modal" role="alert"><p class="member-form-feedback">${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="close-member-modal">Close</button></section></div>`));
  }
  if (action === "close-member-modal" && (event.target === control || control.classList.contains("member-modal-close"))) modalRoot().innerHTML = "";
  if (action === "delete-member") showDeleteConfirmation(control.dataset.memberId);
  if (action === "confirm-member-delete") {
    control.disabled = true;
    control.textContent = "Deleting…";
    deleteMember(control.dataset.memberId).then(() => {
      modalRoot().innerHTML = "";
      window.location.hash = "#/admin/members";
    }).catch((error) => {
      control.disabled = false;
      control.textContent = "Delete member";
      modalRoot().querySelector(".member-form-feedback").textContent = error.message;
    });
  }
  if (action === "retry-members") mountMemberPage();
  if (action === "reset-member-filters") {
    document.querySelector("#member-search").value = "";
    document.querySelector("#member-gender").value = "";
    document.querySelector("#member-trainer").value = "";
    currentPage = 0;
    refreshList();
  }
  if (action === "member-page-prev" && currentPage > 0) { currentPage -= 1; refreshList(); }
  if (action === "member-page-next" && (currentPage + 1) * 100 < total) { currentPage += 1; refreshList(); }
}

export function handleMemberInput(event) {
  if (event.target.matches("#member-search")) {
    currentPage = 0;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshList, 250);
  }
}

export function handleMemberChange(event) {
  if (event.target.matches("#member-gender, #member-trainer")) {
    currentPage = 0;
    refreshList();
  }
}

export async function handleMemberSubmit(event) {
  const form = event.target;
  if (!form.matches("#member-form")) return;
  event.preventDefault();
  const feedback = form.querySelector(".member-form-feedback");
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.height = Number(data.height);
  data.weight = Number(data.weight);
  if (!data.PT) data.PT = null;
  if (form.dataset.memberId) delete data.member_id;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.querySelector("span").textContent = "Saving…";
  feedback.textContent = "";
  try {
    if (form.dataset.memberId) await updateMember(form.dataset.memberId, data);
    else await createMember(data);
    modalRoot().innerHTML = "";
    if (window.location.hash.startsWith("#/admin/members/")) window.location.hash = "#/admin/members";
    else refreshList();
  } catch (error) {
    feedback.textContent = error.message;
    submit.disabled = false;
    submit.querySelector("span").textContent = form.dataset.memberId ? "Save changes" : "Add member";
  }
}

export function closeMemberDialogOnEscape(event) {
  if (event.key === "Escape") modalRoot().innerHTML = "";
}
