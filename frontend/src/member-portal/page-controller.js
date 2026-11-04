import { escapeHtml } from "../members/html.js";
import { getAssignedTrainer, getMemberMemberships, getMemberOverview, getMemberPayment, getMemberPayments, getMemberProfile, updateMemberContact } from "./api.js";
import { contactForm, memberDashboardContent, memberMembershipContent, memberPaymentDetails, memberPaymentsContent, memberProfileContent, memberTrainerContent } from "../pages/member-portal.js";
import { money } from "../pages/payments.js";

let paymentSkip = 0;
let lastPayment;
let profileCache;
let activeRequest = 0;
let selectedMemberId = "";

function modalRoot() { let root = document.querySelector("#member-portal-dialog-root"); if (!root) { root = document.createElement("div"); root.id = "member-portal-dialog-root"; document.body.append(root); } return root; }

async function loadPayments(skip = 0) {
  const root = document.querySelector("#member-payments-page");
  if (!root) return;
  const version = ++activeRequest;
  paymentSkip = skip;
  root.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading your payments…</div>';
  try {
    const data = await getMemberPayments(selectedMemberId, { skip, limit: 100 });
    if (version === activeRequest && root.isConnected) root.outerHTML = memberPaymentsContent(data);
  } catch (error) {
    if (version === activeRequest && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load payment history</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-own-payments">Try again</button></div>`;
  }
}

export async function mountMemberPortalPage({ page, memberId = selectedMemberId } = {}) {
  selectedMemberId = memberId;
  const version = ++activeRequest;
  if (!selectedMemberId) {
    const root = document.querySelector("#member-dashboard-page, #member-profile-page, #member-membership-page, #member-payments-page, #member-trainer-page");
    if (root) root.innerHTML = '<div class="member-state"><strong>Choose a member record</strong><p>Select a member from the workspace menu above to view this dashboard.</p></div>';
    return;
  }
  if (page === "dashboard") {
    const root = document.querySelector("#member-dashboard-page");
    if (!root) return;
    try {
      const data = await getMemberOverview(selectedMemberId);
      if (version === activeRequest && root.isConnected) root.outerHTML = memberDashboardContent(data);
    } catch (error) {
      if (version === activeRequest && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your dashboard</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-member-dashboard">Try again</button></div>`;
    }
  } else if (page === "my-profile") {
    const root = document.querySelector("#member-profile-page");
    if (!root) return;
    try {
      profileCache = await getMemberProfile(selectedMemberId);
      if (version === activeRequest && root.isConnected) root.outerHTML = memberProfileContent(profileCache);
    } catch (error) {
      if (version === activeRequest && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your profile</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-member-profile">Try again</button></div>`;
    }
  } else if (page === "my-membership") {
    const root = document.querySelector("#member-membership-page");
    if (!root) return;
    try {
      const data = await getMemberMemberships(selectedMemberId);
      if (version === activeRequest && root.isConnected) root.outerHTML = memberMembershipContent(data);
    } catch (error) {
      if (version === activeRequest && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your membership</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-member-membership">Try again</button></div>`;
    }
  } else if (page === "my-payments") {
    await loadPayments(0);
  } else if (page === "my-trainer") {
    const root = document.querySelector("#member-trainer-page");
    if (!root) return;
    try {
      const trainer = await getAssignedTrainer(selectedMemberId);
      if (version === activeRequest && root.isConnected) root.outerHTML = memberTrainerContent(trainer);
    } catch (error) {
      if (version === activeRequest && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your trainer</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-member-trainer">Try again</button></div>`;
    }
  }
}

export async function handleMemberPortalClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "edit-own-contact") {
    try {
      if (!profileCache) profileCache = await getMemberProfile(selectedMemberId);
      modalRoot().innerHTML = contactForm(profileCache.contact);
      modalRoot().querySelector('[name="contact"]')?.focus();
    } catch (error) { window.alert(error.message); }
  }
  if (action === "close-member-portal-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().replaceChildren();
  if (action === "view-own-payment") {
    control.disabled = true;
    try { lastPayment = await getMemberPayment(selectedMemberId, control.dataset.paymentId); modalRoot().innerHTML = memberPaymentDetails(lastPayment); }
    catch (error) { window.alert(error.message); }
    finally { control.disabled = false; }
  }
  if (action === "print-own-payment" && lastPayment) printReceipt(lastPayment);
  if (action === "member-payment-prev" && paymentSkip >= 100) loadPayments(paymentSkip - 100);
  if (action === "member-payment-next") loadPayments(paymentSkip + 100);
  if (action === "retry-own-payments") loadPayments(paymentSkip);
  if (action === "retry-member-dashboard") mountMemberPortalPage({ page: "dashboard" });
  if (action === "retry-member-profile") mountMemberPortalPage({ page: "my-profile" });
  if (action === "retry-member-membership") mountMemberPortalPage({ page: "my-membership" });
  if (action === "retry-member-trainer") mountMemberPortalPage({ page: "my-trainer" });
}

export async function handleMemberPortalSubmit(event) {
  const form = event.target;
  if (!form.matches("#member-contact-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const contact = new FormData(form).get("contact");
  const submit = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".member-form-feedback");
  submit.disabled = true; submit.querySelector("span").textContent = "Saving…"; feedback.textContent = "";
  try {
    profileCache = await updateMemberContact(selectedMemberId, contact);
    modalRoot().replaceChildren();
    const page = document.querySelector("#member-profile-page");
    if (page) page.outerHTML = memberProfileContent(profileCache);
  } catch (error) { feedback.textContent = error.message; submit.disabled = false; submit.querySelector("span").textContent = "Save contact"; }
}

function printReceipt(payment) {
  const popup = window.open("", "_blank", "width=720,height=760");
  if (!popup) { window.alert("Allow pop-ups to print the receipt."); return; }
  const safe = (value) => escapeHtml(value ?? "—");
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${safe(payment.payment_id)}</title><style>body{font:15px Arial,sans-serif;color:#263244;padding:36px}.receipt{max-width:620px;margin:auto;border:1px solid #dfe4ea;padding:30px}.brand{color:#d96d48;font-weight:bold;letter-spacing:2px}.rule{border:0;border-top:1px solid #e7ebf0;margin:22px 0}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eff1f4}.amount{font-size:25px;font-weight:bold}</style></head><body><main class="receipt"><div class="brand">IRONCORE · GYM MANAGEMENT</div><h1>Payment receipt</h1><p>Receipt ID: <strong>${safe(payment.payment_id)}</strong></p><hr class="rule"><div class="row"><span>Member</span><strong>${safe(payment.member_name)} (${safe(payment.member_id)})</strong></div><div class="row"><span>Plan</span><strong>${safe(payment.plan_id)}</strong></div><div class="row"><span>Payment date</span><strong>${safe(payment.payment_date)}</strong></div><div class="row"><span>Payment mode</span><strong>${safe(payment.payment_mode)}</strong></div><div class="row"><span>Total paid</span><strong class="amount">${safe(money(payment.amount))}</strong></div><hr class="rule"><p>Thank you for your payment.</p></main><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}

export function closeMemberPortalDialogOnEscape(event) { if (event.key === "Escape") modalRoot().replaceChildren(); }
