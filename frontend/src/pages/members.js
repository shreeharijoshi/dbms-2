import { memberTable } from "../members/member-table.js";
import { escapeHtml, formatDate } from "../members/html.js";

export function membersPage(memberId = null) {
  if (memberId) return `<section class="members-page" id="members-page" data-member-id="${escapeHtml(memberId)}"><div class="member-loading"><span class="member-spinner"></span>Loading member details…</div></section>`;
  return `<section class="members-page" id="members-page"><header class="members-heading"><div><span class="member-eyebrow">PEOPLE &amp; MEMBERSHIPS</span><h1>Members</h1><p>Manage member profiles, contact details and trainer assignments.</p></div><button class="member-button member-button-primary" type="button" data-action="add-member"><span class="member-plus">＋</span> Add member</button></header><div class="member-list-card"><div class="member-toolbar"><label class="member-search"><span aria-hidden="true">⌕</span><input id="member-search" type="search" placeholder="Search by name or member ID…" autocomplete="off"><kbd>⌘ K</kbd></label><label class="member-filter"><span>Gender</span><select id="member-gender"><option value="">All genders</option><option>Female</option><option>Male</option><option>Other</option></select></label><label class="member-filter"><span>Trainer</span><select id="member-trainer"><option value="">All trainers</option></select></label></div><div class="member-list-meta"><strong id="member-count">Loading members…</strong><button type="button" class="member-reset-filters" data-action="reset-member-filters">Clear filters</button></div><div id="member-results" aria-live="polite"><div class="member-loading"><span class="member-spinner"></span>Loading members…</div></div></div></section>`;
}

export function memberDetailsPage(member) {
  const fields = [
    ["Gender", member.gender], ["Contact", member.contact], ["Date of birth", formatDate(member.dob)],
    ["Height", member.height == null ? "—" : `${member.height} cm`], ["Weight", member.weight == null ? "—" : `${member.weight} kg`],
    ["BMI", member.bmi == null ? "—" : Number(member.bmi).toFixed(1)],
    ["Assigned trainer", member.trainer_name || "No trainer assigned"], ["Member status", member.member_status],
  ];
  return `<div class="members-page"><a class="member-back-link" href="#/admin/members">←&nbsp; Back to members</a><header class="member-detail-heading"><span class="member-avatar member-avatar-large">${escapeHtml((member.member_name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase())}</span><div><span class="member-eyebrow">MEMBER PROFILE · ${escapeHtml(member.member_id)}</span><h1>${escapeHtml(member.member_name || "Unnamed member")}</h1><span class="member-status-pill">${escapeHtml(member.member_status)}</span></div><div class="member-detail-actions"><button type="button" class="member-button member-button-muted" data-action="edit-member" data-member-id="${escapeHtml(member.member_id)}">Edit profile</button><button type="button" class="member-button member-button-danger" data-action="delete-member" data-member-id="${escapeHtml(member.member_id)}">Delete</button></div></header><section class="member-detail-card"><div class="member-detail-card-head"><span class="member-eyebrow">PERSONAL INFORMATION</span><p>Member details and assigned trainer</p></div><dl class="member-detail-grid">${fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "—")}</dd></div>`).join("")}</dl></section><div id="member-dialog-root"></div></div>`;
}

export function memberListResult(items) { return memberTable(items); }
