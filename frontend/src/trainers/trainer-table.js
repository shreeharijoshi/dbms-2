import { escapeHtml, formatDate } from "../members/html.js";

function nameInitials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

export function trainerTable(items) {
  if (!items.length) return `<div class="member-state member-empty"><span class="member-state-icon">◎</span><strong>No trainers found</strong><p>Adjust the search or filters, or add a trainer to get started.</p></div>`;
  return `<div class="member-table-wrap"><table class="member-table trainer-table"><thead><tr><th>Trainer</th><th>Date of birth</th><th>Gender</th><th>Height</th><th>Weight</th><th>Specialization</th><th>Qualification</th><th>Shift</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map((trainer) => {
    const id = escapeHtml(trainer.employee_id);
    const name = escapeHtml(trainer.trainer_name || "Unnamed trainer");
    return `<tr><td><a class="member-identity" href="#/admin/trainers/${encodeURIComponent(trainer.employee_id)}"><span class="member-avatar">${escapeHtml(nameInitials(trainer.trainer_name))}</span><span><strong>${name}</strong><small>${id}</small></span></a></td><td>${formatDate(trainer.dob)}</td><td>${escapeHtml(trainer.gender || "—")}</td><td>${trainer.height == null ? "—" : `${escapeHtml(trainer.height)} cm`}</td><td>${trainer.weight == null ? "—" : `${escapeHtml(trainer.weight)} kg`}</td><td>${escapeHtml(trainer.speciality || "—")}</td><td>${escapeHtml(trainer.qualification || "—")}</td><td><span class="trainer-chip">${escapeHtml(trainer.shift || "—")}</span></td><td><a class="member-view-link" href="#/admin/trainers/${encodeURIComponent(trainer.employee_id)}">View&nbsp;›</a></td></tr>`;
  }).join("")}</tbody></table></div>`;
}
