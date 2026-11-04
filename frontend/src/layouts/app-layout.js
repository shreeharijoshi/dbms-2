import { sidebar } from "../components/sidebar.js";
import { topbar } from "../components/topbar.js";
import { roles } from "../navigation.js";
import { dashboard } from "../pages/dashboard.js";
import { adminDashboardPage } from "../pages/admin-dashboard.js";
import { reportsPage } from "../pages/reports.js";
import { placeholder } from "../pages/placeholder.js";
import { membersPage } from "../pages/members.js";
import { trainersPage } from "../pages/trainers.js";
import { membershipPlansPage } from "../pages/membership-plans.js";
import { subscriptionsPage } from "../pages/subscriptions.js";
import { paymentsPage } from "../pages/payments.js";
import { expensesPage } from "../pages/expenses.js";
import { inventoryPage } from "../pages/inventory.js";
import { employeesPage } from "../pages/employees.js";
import { trainerDashboardPage, trainerMembersPage, trainerMyProfilePage } from "../pages/trainer-portal.js";
import { memberDashboardPage, memberMembershipPage, memberPaymentsPage, memberProfilePage, memberTrainerPage } from "../pages/member-portal.js";

export function appLayout({ role, page, memberId, trainerId, trainerMemberId, subscriptionMemberId, enrollMemberId, paymentMemberId }) {
  const content = role === "member" && page === "dashboard"
    ? memberDashboardPage()
    : role === "trainer" && page === "dashboard"
    ? trainerDashboardPage()
    : role === "admin" && page === "dashboard"
    ? adminDashboardPage()
    : page === "dashboard"
    ? dashboard(role)
    : role === "admin" && page === "members"
      ? membersPage(memberId)
      : role === "admin" && page === "trainers"
        ? trainersPage(trainerId)
        : role === "admin" && page === "membership-plans"
          ? membershipPlansPage()
          : role === "admin" && page === "subscriptions"
            ? subscriptionsPage({ mode: subscriptionMemberId ? "member" : "all", memberId: subscriptionMemberId })
            : role === "admin" && page === "enroll-member"
              ? subscriptionsPage({ mode: "enroll", memberId: enrollMemberId })
              : role === "admin" && page === "expiring-memberships"
                ? subscriptionsPage({ mode: "expiring" })
                : role === "admin" && page === "payments"
                  ? paymentsPage(paymentMemberId)
                  : role === "admin" && page === "expenses"
                    ? expensesPage()
                    : role === "admin" && page === "inventory"
                      ? inventoryPage()
                        : role === "admin" && page === "employees"
                        ? employeesPage()
                        : role === "admin" && page === "reports"
                          ? reportsPage()
                        : role === "trainer" && page === "my-members"
                            ? trainerMembersPage(trainerMemberId)
                            : role === "trainer" && page === "my-profile"
                              ? trainerMyProfilePage()
                              : role === "member" && page === "my-profile"
                                ? memberProfilePage()
                                : role === "member" && page === "my-membership"
                                  ? memberMembershipPage()
                                  : role === "member" && page === "my-payments"
                                    ? memberPaymentsPage()
                                    : role === "member" && page === "my-trainer"
                                      ? memberTrainerPage()
                                      : placeholder(role, page);
  const navPage = role === "admin" && ["enroll-member", "expiring-memberships"].includes(page) ? "subscriptions" : page;
  return `<div class="app-shell">${sidebar(role, navPage)}<div class="workspace"><div class="mobile-header-spacer"></div>${topbar(role, navPage)}<main class="main-content" id="main-content" tabindex="-1"><div class="content-inner"><div class="page-context"><span class="context-dot"></span>${roles[role].description}</div>${content}</div></main></div></div>`;
}
