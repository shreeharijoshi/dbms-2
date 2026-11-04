import { escapeHtml, formatDate } from "../members/html.js";

export function subscriptionsPage({ mode = "all", memberId = null } = {}) {
  if (mode === "enroll") {
    return `<section class="members-page" id="subscriptions-page" data-mode="enroll" ${memberId ? `data-member-id="${escapeHtml(memberId)}"` : ""}><a class="member-back-link" href="#/admin/subscriptions">←&nbsp; Back to subscriptions</a><header class="members-heading"><div><span class="member-eyebrow">MEMBER ENROLLMENT</span><h1>Enroll Member</h1><p>Choose an existing member and plan. The end date is calculated from the plan duration.</p></div></header><section class="member-detail-card subscription-form-card"><div id="subscription-enroll-root"><div class="member-loading"><span class="member-spinner"></span>Loading member and plan options…</div></div></section></section>`;
  }
  const expiring = mode === "expiring";
  const memberMode = mode === "member";
  const title = expiring ? "Expiring Memberships" : memberMode ? "Membership History" : "Subscriptions";
  const description = expiring
    ? "Active subscriptions ending within the next seven days."
    : memberMode ? `All current and previous subscriptions for member ${escapeHtml(memberId)}.` : "Review membership dates, plans and subscription status.";
  return `<section class="members-page" id="subscriptions-page" data-mode="${mode}" ${memberMode ? `data-member-id="${escapeHtml(memberId)}"` : ""}><header class="members-heading"><div><span class="member-eyebrow">MEMBERSHIPS</span><h1>${title}</h1><p>${description}</p></div><div class="subscription-heading-actions">${memberMode ? `<a class="member-button member-button-muted" href="#/admin/subscriptions">All subscriptions</a><a class="member-button member-button-primary" href="#/admin/enroll-member/${encodeURIComponent(memberId)}"><span class="member-plus">＋</span> Enroll member</a>` : `<a class="member-button member-button-muted" href="#/admin/expiring-memberships">Expiring soon</a><a class="member-button member-button-primary" href="#/admin/enroll-member"><span class="member-plus">＋</span> Enroll member</a>`}</div></header><div class="member-list-card"><div class="member-toolbar"><label class="member-search"><span aria-hidden="true">⌕</span><input id="subscription-search" type="search" placeholder="Search member, subscription or plan…" autocomplete="off"></label>${!expiring && !memberMode ? `<label class="member-filter"><span>Status</span><select id="subscription-status"><option value="">All statuses</option><option>Active</option><option>Expired</option><option>Cancelled</option></select></label>` : ""}</div><div class="member-list-meta"><strong id="subscription-count">Loading subscriptions…</strong>${!memberMode ? `<button type="button" class="member-reset-filters" data-action="reset-subscription-filters">Clear filters</button>` : ""}</div><div id="subscription-results" aria-live="polite"><div class="member-loading"><span class="member-spinner"></span>Loading subscriptions…</div></div></div></section>`;
}

function statusClass(status) {
  return status === "Active" ? "status-active" : status === "Expired" ? "status-expired" : status === "Cancelled" ? "status-cancelled" : "status-other";
}

function renewalEligible(item) {
  if (item.membership_status === "Cancelled") return false;
  if (item.membership_status === "Expired") return true;
  if (item.membership_status !== "Active" || !item.end_date) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = item.start_date ? new Date(`${item.start_date}T00:00:00`) : today;
  const end = new Date(`${item.end_date}T00:00:00`);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  return start <= today && end >= today && end <= nextWeek;
}

export function subscriptionTable(items, { memberMode = false } = {}) {
  if (!items.length) return `<div class="member-state member-empty"><span class="member-state-icon">◎</span><strong>No subscriptions found</strong><p>${memberMode ? "This member has no subscription history yet." : "Try changing the search or status filter."}</p></div>`;
  return `<div class="member-table-wrap"><table class="member-table subscription-table"><thead><tr><th>Subscription</th><th>Member</th><th>Plan</th><th>Start date</th><th>End date</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map((item) => {
    const membershipId = escapeHtml(item.membership_id);
    const memberPath = `#/admin/subscriptions/member/${encodeURIComponent(item.member_id || "")}`;
    const memberContent = item.member_id
      ? `<a class="subscription-member-link" href="${memberPath}"><strong>${escapeHtml(item.member_name || "Unknown member")}</strong><small>${escapeHtml(item.member_id)}</small></a>`
      : `<span class="subscription-member-link"><strong>${escapeHtml(item.member_name || "Unknown member")}</strong><small>—</small></span>`;
    const actions = `${renewalEligible(item) ? `<button class="member-view-link subscription-action" data-action="renew-subscription" data-membership-id="${membershipId}" data-plan-id="${escapeHtml(item.plan_id || "")}">Renew</button>` : ""}${item.membership_status !== "Cancelled" ? `<button class="subscription-action subscription-action-muted" data-action="cancel-subscription" data-membership-id="${membershipId}">Cancel</button>` : ""}<button class="subscription-action subscription-action-danger" data-action="delete-subscription" data-membership-id="${membershipId}">Delete</button>`;
    return `<tr><td><strong class="subscription-id">${membershipId}</strong></td><td>${memberContent}</td><td><span class="subscription-plan-id">${escapeHtml(item.plan_id || "—")}</span><small class="subscription-plan-meta">${item.duration == null ? "" : `${escapeHtml(item.duration)} ${Number(item.duration) === 1 ? "month" : "months"}${item.plan_price == null ? "" : ` · ${new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(item.plan_price))}`}`}</small></td><td>${formatDate(item.start_date)}</td><td>${formatDate(item.end_date)}</td><td><span class="subscription-status ${statusClass(item.membership_status)}">${escapeHtml(item.membership_status || "Unknown")}</span></td><td><span class="subscription-actions">${actions}</span></td></tr>`;
  }).join("")}</tbody></table></div>`;
}

export function enrollmentForm(options, { memberId = "" } = {}) {
  const members = options.members.map((member) => `<option value="${escapeHtml(member.member_id)}" ${member.member_id === memberId ? "selected" : ""}>${escapeHtml(member.member_name || member.member_id)} · ${escapeHtml(member.member_id)}</option>`).join("");
  const plans = options.plans.map((plan) => `<option value="${escapeHtml(plan.plan_id)}">${escapeHtml(plan.plan_id)} · ${escapeHtml(plan.duration)} ${Number(plan.duration) === 1 ? "month" : "months"}${plan.price == null ? "" : ` · ${new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(plan.price))}`}</option>`).join("");
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return `<form id="subscription-enroll-form" class="subscription-enroll-form" novalidate><div class="member-form-grid"><label>Member<select name="member_id" required><option value="">Select a member</option>${members}</select></label><label>Membership plan<select name="plan_id" required><option value="">Select a plan</option>${plans}</select></label><label>Start date<input name="start_date" type="date" min="${date}" value="${date}" required></label></div><p class="subscription-date-note">The end date is inclusive and calculated as the day before the matching date after the plan duration.</p><p class="member-form-feedback" role="alert" aria-live="polite"></p><footer class="member-modal-actions"><button class="member-button member-button-primary" type="submit"><span>Enroll member</span></button></footer></form>`;
}

export function renewalDialog(options, membershipId, currentPlanId) {
  const plans = options.plans.map((plan) => `<option value="${escapeHtml(plan.plan_id)}" ${plan.plan_id === currentPlanId ? "selected" : ""}>${escapeHtml(plan.plan_id)} · ${escapeHtml(plan.duration)} ${Number(plan.duration) === 1 ? "month" : "months"}</option>`).join("");
  return `<div class="member-modal-backdrop" data-action="close-renewal-modal"><section class="member-modal member-delete-modal" role="dialog" aria-modal="true" aria-labelledby="renewal-title"><header class="member-modal-head"><div><span class="member-eyebrow">MEMBERSHIP RENEWAL</span><h2 id="renewal-title">Renew subscription</h2></div><button class="member-modal-close" type="button" data-action="close-renewal-modal" aria-label="Close">×</button></header><form id="subscription-renew-form" data-membership-id="${escapeHtml(membershipId)}" novalidate><label class="subscription-renew-label">Renewal plan<select name="plan_id" required><option value="">Select a plan</option>${plans}</select></label><p class="subscription-date-note">The previous subscription stays in history. Renewal begins the day after its end date, or today if it has expired.</p><p class="member-form-feedback" role="alert" aria-live="polite"></p><footer class="member-modal-actions"><button type="button" class="member-button member-button-muted" data-action="close-renewal-modal">Cancel</button><button class="member-button member-button-primary" type="submit"><span>Create renewal</span></button></footer></form></section></div>`;
}
