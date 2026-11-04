import { icon } from "./icons.js";
import { roles } from "../navigation.js";

export function topbar(role, page) {
  const config = roles[role];
  const title = config.links.find((item) => item[1] === page)?.[0] || "Dashboard";
  return `
    <header class="topbar">
      <button class="icon-button menu-toggle" data-action="open-menu" aria-label="Open navigation">${icon("menu")}</button>
      <div class="breadcrumbs"><span>Workspace</span><span class="crumb-divider">/</span><strong>${title}</strong></div>
      <div class="topbar-actions">
        <span class="workspace-role">${config.label} workspace</span>
        <span class="topbar-divider"></span>
        <button class="icon-button search-toggle" aria-label="Search" title="Search is a layout preview">${icon("search")}</button>
        <button class="icon-button notification-button" aria-label="Notifications" title="Notifications">${icon("bell")}<span class="notification-dot"></span></button>
        <div class="topbar-user"><span class="avatar">${role === "admin" ? "IC" : role === "trainer" ? "TR" : "MB"}</span><span class="user-label"><strong>${role === "admin" ? "IronCore" : role === "trainer" ? "Trainer" : "Member"}</strong><small>${config.label} account</small></span></div>
        <button class="logout-button" data-action="logout">${icon("logout")}<span>Sign out</span></button>
      </div>
    </header>`;
}
