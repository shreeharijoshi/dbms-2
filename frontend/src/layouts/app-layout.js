import { sidebar } from "../components/sidebar.js";
import { topbar } from "../components/topbar.js";
import { roles } from "../navigation.js";
import { adminDashboardPage } from "../pages/admin-dashboard.js";
import { reportsPage } from "../pages/reports.js";
import { membersPage } from "../pages/members.js";
import { trainersPage } from "../pages/trainers.js";
import { membershipPlansPage } from "../pages/membership-plans.js";
import { subscriptionsPage } from "../pages/subscriptions.js";
import { paymentsPage } from "../pages/payments.js";
import { expensesPage } from "../pages/expenses.js";
import { inventoryPage } from "../pages/inventory.js";
import { employeesPage } from "../pages/employees.js";

export function appLayout({ page, memberId, trainerId, subscriptionMemberId, enrollMemberId, paymentMemberId }) {
  const pages = {
    dashboard: () => adminDashboardPage(),
    members: () => membersPage(memberId),
    trainers: () => trainersPage(trainerId),
    "membership-plans": () => membershipPlansPage(),
    subscriptions: () => subscriptionsPage({ mode: subscriptionMemberId ? "member" : "all", memberId: subscriptionMemberId }),
    "enroll-member": () => subscriptionsPage({ mode: "enroll", memberId: enrollMemberId }),
    "expiring-memberships": () => subscriptionsPage({ mode: "expiring" }),
    payments: () => paymentsPage(paymentMemberId),
    expenses: () => expensesPage(),
    inventory: () => inventoryPage(),
    employees: () => employeesPage(),
    reports: () => reportsPage(),
  };
  const content = (pages[page] || pages.dashboard)();
  const navPage = ["enroll-member", "expiring-memberships"].includes(page) ? "subscriptions" : page;
  return `<div class="app-shell">${sidebar("admin", navPage)}<div class="workspace"><div class="mobile-header-spacer"></div>${topbar(navPage)}<main class="main-content" id="main-content" tabindex="-1"><div class="content-inner"><div class="page-context"><span class="context-dot"></span>${roles.admin.description}</div>${content}</div></main></div></div>`;
}
