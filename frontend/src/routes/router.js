import { appLayout } from "../layouts/app-layout.js";
import { parseRoute } from "../navigation.js";
import { loginPage } from "../pages/login.js";
import {
  dashboardPathForRole,
  roleRedirectForRoute,
  validateCurrentSession,
} from "../auth/route-guard.js";
import {
  clearSession,
  getAccessToken,
  setAuthNotice,
  takeAuthNotice,
} from "../auth/store.js";
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

let activeRender = 0;

export async function renderRoute() {
  const renderId = ++activeRender;
  const app = document.querySelector("#app");
  const route = parseRoute();

  if (route.name === "login") {
    if (!window.location.hash) window.history.replaceState(null, "", "#/login");
    const token = getAccessToken();
    if (token) {
      app.innerHTML = routeLoading();
      let user = null;
      try {
        user = await validateCurrentSession();
      } catch (error) {
        if (error.status === 401) {
          clearSession();
          setAuthNotice("Your session has expired. Please sign in again.");
        } else {
          setAuthNotice(error.message || "Unable to verify your session. Try again.");
        }
      }
      if (renderId !== activeRender) return;
      if (user) {
        const destination = dashboardPathForRole(user.role);
        if (destination === "#/login") {
          clearSession();
          setAuthNotice("This account has an unsupported role. Contact your administrator.");
        } else {
          window.location.hash = destination;
          return;
        }
      }
    }
    document.title = "Sign in | IronCore";
    app.innerHTML = loginPage(takeAuthNotice());
    document.body.classList.remove("menu-open");
    return;
  }

  app.innerHTML = routeLoading();
  if (!getAccessToken()) {
    setAuthNotice("Sign in to access your workspace.");
    window.location.hash = "#/login";
    return;
  }

  let user;
  try {
    user = await validateCurrentSession();
  } catch (error) {
    if (renderId !== activeRender) return;
    if (error.status === 401) {
      clearSession();
      setAuthNotice("Your session has expired. Please sign in again.");
    } else {
      setAuthNotice(error.message || "Unable to verify your session. Try again.");
    }
    window.location.hash = "#/login";
    return;
  }
  if (renderId !== activeRender) return;

  const authorizedPath = roleRedirectForRoute(user, route.role);
  if (authorizedPath === "#/login") {
    clearSession();
    setAuthNotice("This account has an unsupported role. Contact your administrator.");
    window.location.hash = "#/login";
    return;
  }
  if (authorizedPath) {
    window.location.hash = authorizedPath;
    return;
  }

  document.title = `${route.page === "dashboard" ? "Dashboard" : route.page.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} | IronCore`;
  app.innerHTML = appLayout(route);
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
  if (route.role === "trainer") mountTrainerPortalPage(route);
  if (route.role === "member") mountMemberPortalPage(route);
}

function routeLoading() {
  return '<main class="route-loading" role="status"><span class="route-spinner"></span><p>Checking your session...</p></main>';
}
