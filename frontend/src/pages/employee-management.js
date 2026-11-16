import { miscellaneousEmployeesPanel } from "./employees.js";
import { trainersPage } from "./trainers.js";

export function employeeManagementPage(trainerId = null) {
  return `<section class="employee-management-page"><header class="members-heading employees-heading"><div><span class="member-eyebrow">PEOPLE &amp; STAFF</span><h1>Employees</h1><p>View and manage trainers and miscellaneous employees.</p></div></header>${trainersPage(trainerId)}${miscellaneousEmployeesPanel()}</section>`;
}
