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
import { mountTrainerPortalPage } from "../trainer-portal/page-controller.js";
import { mountMemberPortalPage } from "../member-portal/page-controller.js";
import { mountAdminDashboard } from "../pages/admin-dashboard.js";
import { mountReportsPage } from "../analytics/reports-controller.js";
import { mountWorkspaceSelector, selectedWorkspaceRecord } from "../workspace/selection.js";

let activeRender = 0;

export async function renderRoute() {
  const renderId = ++activeRender;
  const app = document.querySelector("#app");
  const route = parseRoute();
  if (!window.location.hash) window.history.replaceState(null, "", "#/admin/dashboard");

  const title = route.page === "dashboard" ? "Dashboard" : route.page.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  document.title = `${title} | IronCore`;
  app.innerHTML = appLayout(route);
  document.body.classList.remove("menu-open");
  await mountWorkspaceSelector(route.role);
  if (renderId !== activeRender) return;

  if (route.role === "admin" && route.page === "members") mountMemberPage();
  if (route.role === "admin" && route.page === "trainers") mountTrainerPage();
  if (route.role === "admin" && route.page === "membership-plans") mountPlansPage();
  if (route.role === "admin" && ["subscriptions", "enroll-member", "expiring-memberships"].includes(route.page)) mountSubscriptionsPage();
  if (route.role === "admin" && route.page === "payments") mountPaymentsPage();
  if (route.role === "admin" && route.page === "expenses") mountExpensesPage();
  if (route.role === "admin" && route.page === "inventory") mountInventoryPage();
  if (route.role === "admin" && route.page === "employees") mountEmployeesPage();
  if (route.role === "admin" && route.page === "dashboard") mountAdminDashboard();
  if (route.role === "admin" && route.page === "reports") mountReportsPage();
  if (route.role === "trainer") mountTrainerPortalPage({ ...route, trainerId: selectedWorkspaceRecord("trainer") });
  if (route.role === "member") mountMemberPortalPage({ ...route, memberId: selectedWorkspaceRecord("member") });
}
