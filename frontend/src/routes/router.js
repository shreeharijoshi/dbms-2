import { appLayout } from "../layouts/app-layout.js";
import { parseRoute } from "../navigation.js";
import { mountMemberPage } from "../members/page-controller.js";
import { mountTrainerPage } from "../trainers/page-controller.js";
import { mountPlansPage } from "../membership-plans/page-controller.js";
import { mountSubscriptionsPage } from "../subscriptions/page-controller.js";
import { mountPaymentsPage } from "../payments/page-controller.js";
import { mountExpensesPage } from "../expenses/page-controller.js";
import { mountInventoryPage } from "../inventory/page-controller.js";
import { mountEmployeesPage } from "../employees/page-controller.js";
import { mountAdminDashboard } from "../pages/admin-dashboard.js";
import { mountReportsPage } from "../analytics/reports-controller.js";

export function renderRoute() {
  const app = document.querySelector("#app");
  if (!/^#\/admin(?:\/|$)/.test(window.location.hash)) window.history.replaceState(null, "", "#/admin/dashboard");
  const legacyTrainerRoute = window.location.hash.match(/^#\/admin\/trainers(?:\/([^/?#]+))?$/);
  if (legacyTrainerRoute) {
    const canonicalRoute = legacyTrainerRoute[1]
      ? `#/admin/employees/trainers/${legacyTrainerRoute[1]}`
      : "#/admin/employees";
    window.history.replaceState(null, "", canonicalRoute);
  }
  const route = parseRoute();

  const title = route.page === "dashboard" ? "Dashboard" : route.page.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  document.title = `${title} | IronCore`;
  app.innerHTML = appLayout(route);
  document.body.classList.remove("menu-open");

  if (route.role === "admin" && route.page === "members") mountMemberPage();
  if (route.role === "admin" && route.page === "employees") { mountTrainerPage(); mountEmployeesPage(); }
  if (route.role === "admin" && route.page === "membership-plans") mountPlansPage();
  if (route.role === "admin" && ["subscriptions", "enroll-member", "expiring-memberships"].includes(route.page)) mountSubscriptionsPage();
  if (route.role === "admin" && route.page === "payments") mountPaymentsPage();
  if (route.role === "admin" && route.page === "expenses") mountExpensesPage();
  if (route.role === "admin" && route.page === "inventory") mountInventoryPage();
  if (route.role === "admin" && route.page === "dashboard") mountAdminDashboard();
  if (route.role === "admin" && route.page === "reports") mountReportsPage();
}
