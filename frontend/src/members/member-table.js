import { escapeHtml, formatDate } from "./html.js";

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function statusClass(status) {
  return status === "Active" ? "is-active" : "is-inactive";
}

export function memberTable(items) {
  if (!items.length) return `<div class="member-state member-empty"><span class="member-state-icon">◉</span><strong>No members found</strong><p>Try changing your search or filters, or add a member to get started.</p></div>`;
  return `<div class="member-table-wrap"><table class="member-table"><thead><tr><th>Member</th><th>Gender</th><th>Contact</th><th>Date of birth</th><th>Height</th><th>Weight</th><th>BMI</th><th>Assigned trainer</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map((member) => {
    const id = escapeHtml(member.member_id);
    const name = escapeHtml(member.member_name || "Unnamed member");
    return `<tr><td><a class="member-identity" href="#/admin/members/${encodeURIComponent(member.member_id)}"><span class="member-avatar">${escapeHtml(initials(member.member_name))}</span><span><strong>${name}</strong><small>${id}</small></span></a></td><td>${escapeHtml(member.gender || "—")}</td><td>${escapeHtml(member.contact || "—")}</td><td>${formatDate(member.dob)}</td><td>${member.height == null ? "—" : `${escapeHtml(member.height)} cm`}</td><td>${member.weight == null ? "—" : `${escapeHtml(member.weight)} kg`}</td><td><span class="bmi-value">${member.bmi == null ? "—" : escapeHtml(Number(member.bmi).toFixed(1))}</span></td><td>${member.trainer_name ? `<span class="trainer-chip">${escapeHtml(member.trainer_name)}</span>` : '<span class="unassigned-label">Unassigned</span>'}</td><td><span class="member-status-pill ${statusClass(member.member_status)}">${escapeHtml(member.member_status)}</span></td><td><a class="member-view-link" href="#/admin/members/${encodeURIComponent(member.member_id)}" aria-label="View ${name}">View&nbsp;›</a></td></tr>`;
  }).join("")}</tbody></table></div>`;
}
