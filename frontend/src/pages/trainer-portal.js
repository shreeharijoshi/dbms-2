import { escapeHtml, formatDate } from "../members/html.js";

function initials(name) { return (name || "?").trim().split(/\s+/).slice(0, 2).map((word) => word[0] || "").join("").toUpperCase(); }

export function trainerDashboardPage() {
  return `<section id="trainer-dashboard-page" class="trainer-portal-page"><div class="member-loading"><span class="member-spinner"></span>Loading your coaching workspace…</div></section>`;
}

export function trainerDashboardContent(data) {
  const trainer = data.trainer;
  return `<section class="trainer-portal-page"><header class="trainer-portal-welcome"><div><span class="member-eyebrow">TRAINER OVERVIEW</span><h1>Welcome, ${escapeHtml(trainer.trainer_name || "Trainer")}.</h1><p>Your coaching workspace and assigned member overview.</p></div><span class="trainer-portal-avatar">${escapeHtml(initials(trainer.trainer_name))}</span></header><div class="trainer-overview-stats"><article><span>Assigned members</span><strong>${escapeHtml(data.assigned_member_count)}</strong></article><article><span>Specialization</span><strong>${escapeHtml(trainer.speciality || "—")}</strong></article><article><span>Qualification</span><strong>${escapeHtml(trainer.qualification || "—")}</strong></article><article><span>Assigned shift</span><strong>${escapeHtml(trainer.shift || "—")}</strong></article></div><section class="member-list-card trainer-portal-card"><header class="trainer-portal-card-head"><div><span class="member-eyebrow">YOUR CLIENTS</span><h2>Assigned members</h2><p>${escapeHtml(data.assigned_member_count)} member${Number(data.assigned_member_count) === 1 ? "" : "s"} assigned to your trainer account</p></div><a class="member-button member-button-muted" href="#/trainer/my-members">View all</a></header>${trainerMemberTable(data.members, { compact: true })}</section></section>`;
}

export function trainerMembersPage(memberId = null) {
  return memberId
    ? `<section class="trainer-portal-page" id="trainer-member-profile" data-member-id="${escapeHtml(memberId)}"><a class="member-back-link" href="#/trainer/my-members">←&nbsp; Back to my members</a><div class="member-loading"><span class="member-spinner"></span>Loading member profile…</div></section>`
    : `<section class="trainer-portal-page" id="trainer-members-page"><header class="members-heading"><div><span class="member-eyebrow">YOUR CLIENTS</span><h1>My Members</h1><p>Members assigned to your trainer account.</p></div></header><div class="member-list-card"><div class="member-toolbar"><label class="member-search"><span aria-hidden="true">⌕</span><input id="trainer-member-search" type="search" placeholder="Search name or member ID…" autocomplete="off"></label></div><div class="member-list-meta"><strong id="trainer-member-count">Loading members…</strong></div><div id="trainer-member-results" aria-live="polite"><div class="member-loading"><span class="member-spinner"></span>Loading members…</div></div></div></section>`;
}

export function trainerMemberTable(items, { compact = false } = {}) {
  if (!items.length) return `<div class="member-state member-empty"><span class="member-state-icon">♙</span><strong>No assigned members yet</strong><p>Members assigned to your trainer account will appear here.</p></div>`;
  return `<div class="member-table-wrap"><table class="member-table trainer-portal-members-table"><thead><tr><th>Member</th><th>Gender</th>${compact ? "" : "<th>Contact</th><th>Height</th><th>Weight</th>"}<th>BMI</th><th>Membership</th>${compact ? "" : "<th>Expires</th>"}<th></th></tr></thead><tbody>${items.map((member) => `<tr><td><a class="member-identity" href="#/trainer/my-members/${encodeURIComponent(member.member_id)}"><span class="member-avatar">${escapeHtml(initials(member.member_name))}</span><span><strong>${escapeHtml(member.member_name || "Unnamed member")}</strong><small>${escapeHtml(member.member_id)}</small></span></a></td><td>${escapeHtml(member.gender || "—")}</td>${compact ? "" : `<td>${escapeHtml(member.contact || "—")}</td><td>${member.height == null ? "—" : `${escapeHtml(member.height)} cm`}</td><td>${member.weight == null ? "—" : `${escapeHtml(member.weight)} kg`}</td>`}<td>${member.bmi == null ? "—" : escapeHtml(Number(member.bmi).toFixed(1))}</td><td><span class="trainer-membership-status ${statusClass(member.membership_status)}">${escapeHtml(member.membership_status || "No membership")}</span></td>${compact ? "" : `<td>${formatDate(member.membership_end_date)}</td>`}<td><a class="member-view-link" href="#/trainer/my-members/${encodeURIComponent(member.member_id)}">View</a></td></tr>`).join("")}</tbody></table></div>`;
}

export function trainerMemberProfile(member) {
  const personal = [["Member ID", member.member_id], ["Gender", member.gender], ["Contact", member.contact], ["Date of birth", formatDate(member.dob)], ["Height", member.height == null ? "—" : `${member.height} cm`], ["Weight", member.weight == null ? "—" : `${member.weight} kg`], ["BMI", member.bmi == null ? "—" : Number(member.bmi).toFixed(1)], ["Member status", member.member_status]];
  const membership = member.membership_id
    ? [["Subscription ID", member.membership_id], ["Plan", member.plan_id || "—"], ["Membership status", member.membership_status || "—"], ["Start date", formatDate(member.membership_start_date)], ["Expiry date", formatDate(member.membership_end_date)]]
    : [["Membership", "No membership record found"]];
  return `<section class="trainer-portal-page"><a class="member-back-link" href="#/trainer/my-members">←&nbsp; Back to my members</a><header class="member-detail-heading"><span class="member-avatar member-avatar-large">${escapeHtml(initials(member.member_name))}</span><div><span class="member-eyebrow">ASSIGNED MEMBER</span><h1>${escapeHtml(member.member_name || "Unnamed member")}</h1><span class="member-status-pill">${escapeHtml(member.membership_status || member.member_status || "Member")}</span></div></header><section class="member-detail-card"><div class="member-detail-card-head"><span class="member-eyebrow">PERSONAL INFORMATION</span><p>Member details available to their assigned trainer</p></div><dl class="member-detail-grid">${personal.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "—")}</dd></div>`).join("")}</dl></section><section class="member-detail-card trainer-portal-membership-card"><div class="member-detail-card-head"><span class="member-eyebrow">MEMBERSHIP</span><p>Current or most recent membership record</p></div><dl class="member-detail-grid">${membership.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "—")}</dd></div>`).join("")}</dl></section></section>`;
}

export function trainerMyProfilePage() {
  return `<section class="trainer-portal-page" id="trainer-profile-page"><div class="member-loading"><span class="member-spinner"></span>Loading your profile…</div></section>`;
}

export function trainerProfileContent(profile) {
  const fields = [["Employee ID", profile.employee_id], ["Date of birth", formatDate(profile.dob)], ["Gender", profile.gender], ["Height", profile.height == null ? "—" : `${profile.height} cm`], ["Weight", profile.weight == null ? "—" : `${profile.weight} kg`], ["Specialization", profile.speciality], ["Qualification", profile.qualification], ["Shift", profile.shift]];
  return `<section class="trainer-portal-page"><header class="member-detail-heading"><span class="member-avatar member-avatar-large">${escapeHtml(initials(profile.trainer_name))}</span><div><span class="member-eyebrow">MY PROFILE</span><h1>${escapeHtml(profile.trainer_name || "Trainer")}</h1></div></header><section class="member-detail-card"><div class="member-detail-card-head"><span class="member-eyebrow">PROFILE INFORMATION</span><p>Trainer profile provided by the gym administrator.</p></div><dl class="member-detail-grid">${fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "—")}</dd></div>`).join("")}</dl></section></section>`;
}

function statusClass(status) { return status === "Active" ? "trainer-status-active" : status === "Expired" ? "trainer-status-expired" : status === "Cancelled" ? "trainer-status-cancelled" : "trainer-status-none"; }
