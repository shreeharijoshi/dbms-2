import { escapeHtml, formatDate } from "../members/html.js";
import { trainerTable } from "../trainers/trainer-table.js";

export function trainersPage(employeeId = null) {
  if (employeeId) return `<section class="members-page" id="trainers-page" data-employee-id="${escapeHtml(employeeId)}"><div class="member-loading"><span class="member-spinner"></span>Loading trainer profile…</div></section>`;
  return `<section class="members-page" id="trainers-page"><header class="members-heading"><div><span class="member-eyebrow">PEOPLE &amp; COACHING</span><h1>Trainers</h1><p>Manage trainer profiles, qualifications and member assignments.</p></div><button class="member-button member-button-primary" type="button" data-action="add-trainer"><span class="member-plus">＋</span> Add trainer</button></header><div class="member-list-card"><div class="member-toolbar"><label class="member-search"><span aria-hidden="true">⌕</span><input id="trainer-search" type="search" placeholder="Search by name or employee ID…" autocomplete="off"></label><label class="member-filter"><span>Specialization</span><select id="trainer-speciality"><option value="">All specializations</option></select></label><label class="member-filter"><span>Shift</span><select id="trainer-shift"><option value="">All shifts</option></select></label></div><div class="member-list-meta"><strong id="trainer-count">Loading trainers…</strong><button type="button" class="member-reset-filters" data-action="reset-trainer-filters">Clear filters</button></div><div id="trainer-results" aria-live="polite"><div class="member-loading"><span class="member-spinner"></span>Loading trainers…</div></div></div></section>`;
}

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

export function trainerDetailsPage(trainer, members) {
  const fields = [
    ["Date of birth", formatDate(trainer.dob)], ["Gender", trainer.gender || "—"],
    ["Height", trainer.height == null ? "—" : `${trainer.height} cm`], ["Weight", trainer.weight == null ? "—" : `${trainer.weight} kg`],
    ["Specialization", trainer.speciality || "—"], ["Qualification", trainer.qualification || "—"], ["Shift", trainer.shift || "—"],
  ];
  const memberList = members.length
    ? `<div class="member-table-wrap"><table class="member-table assigned-members-table"><thead><tr><th>Member</th><th>Gender</th><th>Contact</th><th>Status</th></tr></thead><tbody>${members.map((member) => `<tr><td><a class="member-identity" href="#/admin/members/${encodeURIComponent(member.member_id)}"><span class="member-avatar">${escapeHtml(initials(member.member_name))}</span><span><strong>${escapeHtml(member.member_name || "Unnamed member")}</strong><small>${escapeHtml(member.member_id)}</small></span></a></td><td>${escapeHtml(member.gender || "—")}</td><td>${escapeHtml(member.contact || "—")}</td><td>${escapeHtml(member.member_status)}</td></tr>`).join("")}</tbody></table></div>`
    : `<div class="member-state member-empty assigned-members-empty"><span class="member-state-icon">◎</span><strong>No members assigned</strong><p>Members assigned to this trainer will appear here.</p></div>`;
  return `<div class="members-page"><a class="member-back-link" href="#/admin/trainers">←&nbsp; Back to trainers</a><header class="member-detail-heading"><span class="member-avatar member-avatar-large">${escapeHtml(initials(trainer.trainer_name))}</span><div><span class="member-eyebrow">TRAINER PROFILE · ${escapeHtml(trainer.employee_id)}</span><h1>${escapeHtml(trainer.trainer_name || "Unnamed trainer")}</h1><span class="trainer-member-count">${escapeHtml(trainer.assigned_member_count)} assigned ${Number(trainer.assigned_member_count) === 1 ? "member" : "members"}</span></div><div class="member-detail-actions"><button type="button" class="member-button member-button-muted" data-action="edit-trainer" data-employee-id="${escapeHtml(trainer.employee_id)}">Edit profile</button><button type="button" class="member-button member-button-danger" data-action="delete-trainer" data-employee-id="${escapeHtml(trainer.employee_id)}">Delete</button></div></header><section class="member-detail-card trainer-detail-card"><div class="member-detail-card-head"><span class="member-eyebrow">PROFESSIONAL INFORMATION</span><p>Trainer details and coaching assignment</p></div><dl class="member-detail-grid">${fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section><section class="member-detail-card trainer-assigned-card"><div class="member-detail-card-head"><span class="member-eyebrow">ASSIGNED MEMBERS</span><p>${escapeHtml(members.length)} ${members.length === 1 ? "member" : "members"} currently assigned to this trainer</p></div>${memberList}</section><div id="trainer-dialog-root"></div></div>`;
}

export function trainerListResult(items) { return trainerTable(items); }
