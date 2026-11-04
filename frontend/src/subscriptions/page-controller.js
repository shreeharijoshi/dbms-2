import {
  deleteSubscription,
  enrollMember,
  getExpiringSubscriptions,
  getMemberSubscriptions,
  getSubscriptionOptions,
  getSubscriptions,
  renewSubscription,
  updateSubscriptionStatus,
} from "./api.js";
import { escapeHtml } from "../members/html.js";
import { enrollmentForm, renewalDialog, subscriptionTable } from "../pages/subscriptions.js";

let currentPage = 0;
let total = 0;
let debounceTimer;
let activeLoad = 0;

function modalRoot() {
  let root = document.querySelector("#subscription-dialog-root");
  if (!root) { root = document.createElement("div"); root.id = "subscription-dialog-root"; document.body.append(root); }
  return root;
}

function showModal(markup) {
  const root = modalRoot();
  root.innerHTML = markup;
  root.querySelector("select, input")?.focus();
}

async function getOptions() {
  return getSubscriptionOptions();
}

async function refreshSubscriptions() {
  const root = document.querySelector("#subscriptions-page");
  if (!root || root.dataset.mode === "enroll") return;
  const requestId = ++activeLoad;
  const result = root.querySelector("#subscription-results");
  const count = root.querySelector("#subscription-count");
  result.innerHTML = `<div class="member-loading"><span class="member-spinner"></span>Loading subscriptions…</div>`;
  count.textContent = "Loading subscriptions…";
  const search = root.querySelector("#subscription-search")?.value.trim() || "";
  const filters = { search, skip: currentPage * 100, limit: 100 };
  if (root.dataset.mode === "member") filters.memberId = root.dataset.memberId;
  if (root.dataset.mode === "expiring") filters.expiring = true;
  if (root.dataset.mode === "all") filters.status = root.querySelector("#subscription-status").value;
  try {
    const response = filters.memberId
      ? await getMemberSubscriptions(filters.memberId, filters)
      : filters.expiring
        ? await getExpiringSubscriptions(filters)
        : await getSubscriptions(filters);
    if (requestId !== activeLoad || !root.isConnected) return;
    total = response.total;
    count.textContent = `${total} ${total === 1 ? "subscription" : "subscriptions"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    result.innerHTML = `${subscriptionTable(response.items, { memberMode: root.dataset.mode === "member" })}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="subscription-page-prev" ${currentPage === 0 ? "disabled" : ""}>Previous</button><span>Page ${currentPage + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="subscription-page-next" ${currentPage + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== activeLoad || !root.isConnected) return;
    count.textContent = "Subscriptions unavailable";
    result.innerHTML = `<div class="member-state member-error"><strong>Unable to load subscriptions</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-subscriptions">Try again</button></div>`;
  }
}

export async function mountSubscriptionsPage() {
  const root = document.querySelector("#subscriptions-page");
  if (!root) return;
  currentPage = 0;
  const requestId = ++activeLoad;
  if (root.dataset.mode === "enroll") {
    const target = root.querySelector("#subscription-enroll-root");
    try {
      const options = await getOptions();
      if (requestId !== activeLoad || !root.isConnected) return;
      if (!options.members.length || !options.plans.length) {
        target.innerHTML = `<div class="member-state member-empty"><strong>Members and plans are required</strong><p>Create at least one member and one membership plan before enrollment.</p></div>`;
        return;
      }
      target.innerHTML = enrollmentForm(options, { memberId: root.dataset.memberId || "" });
    } catch (error) {
      if (!root.isConnected) return;
      target.innerHTML = `<div class="member-state member-error"><strong>Unable to load enrollment options</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-subscriptions">Try again</button></div>`;
    }
    return;
  }
  await refreshSubscriptions();
}

export async function handleSubscriptionClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "retry-subscriptions") mountSubscriptionsPage();
  if (action === "reset-subscription-filters") {
    const root = document.querySelector("#subscriptions-page");
    root.querySelector("#subscription-search").value = "";
    if (root.querySelector("#subscription-status")) root.querySelector("#subscription-status").value = "";
    currentPage = 0;
    refreshSubscriptions();
  }
  if (action === "subscription-page-prev" && currentPage > 0) { currentPage -= 1; refreshSubscriptions(); }
  if (action === "subscription-page-next" && (currentPage + 1) * 100 < total) { currentPage += 1; refreshSubscriptions(); }
  if (action === "renew-subscription") {
    control.disabled = true;
    try {
      const options = await getOptions();
      showModal(renewalDialog(options, control.dataset.membershipId, control.dataset.planId));
      control.disabled = false;
    } catch (error) {
      control.disabled = false;
      window.alert(error.message);
    }
  }
  if (action === "close-renewal-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().innerHTML = "";
  if (action === "cancel-subscription") {
    control.disabled = true;
    updateSubscriptionStatus(control.dataset.membershipId, "Cancelled").then(refreshSubscriptions).catch((error) => {
      control.disabled = false;
      window.alert(error.message);
    });
  }
  if (action === "delete-subscription") {
    const id = control.dataset.membershipId;
    if (window.confirm(`Delete subscription ${id}? This cannot be undone, and payment history prevents deletion.`)) {
      control.disabled = true;
      deleteSubscription(id).then(refreshSubscriptions).catch((error) => {
        control.disabled = false;
        window.alert(error.message);
      });
    }
  }
}

export function handleSubscriptionInput(event) {
  if (!event.target.matches("#subscription-search")) return;
  currentPage = 0;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshSubscriptions, 250);
}

export function handleSubscriptionChange(event) {
  if (!event.target.matches("#subscription-status")) return;
  currentPage = 0;
  refreshSubscriptions();
}

export async function handleSubscriptionSubmit(event) {
  const form = event.target;
  if (!form.matches("#subscription-enroll-form, #subscription-renew-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const feedback = form.querySelector(".member-form-feedback");
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.querySelector("span").textContent = form.id === "subscription-enroll-form" ? "Enrolling…" : "Renewing…";
  feedback.textContent = "";
  try {
    if (form.id === "subscription-enroll-form") {
      const data = Object.fromEntries(new FormData(form).entries());
      const subscription = await enrollMember(data);
      window.location.hash = `#/admin/subscriptions/member/${encodeURIComponent(subscription.member_id)}`;
    } else {
      await renewSubscription(form.dataset.membershipId, new FormData(form).get("plan_id"));
      modalRoot().innerHTML = "";
      refreshSubscriptions();
    }
  } catch (error) {
    feedback.textContent = error.message;
    submit.disabled = false;
    submit.querySelector("span").textContent = form.id === "subscription-enroll-form" ? "Enroll member" : "Create renewal";
  }
}

export function closeSubscriptionDialogOnEscape(event) {
  if (event.key === "Escape") document.querySelector("#subscription-dialog-root")?.replaceChildren();
}
