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
        <label class="role-switch"><span class="sr-only">Choose workspace</span><select id="workspace-role-select" aria-label="Choose workspace">${Object.entries(roles).map(([key, value]) => `<option value="${key}" ${key === role ? "selected" : ""}>${value.label} workspace</option>`).join("")}</select><span class="select-caret" aria-hidden="true">⌄</span></label>
        ${role === "trainer" || role === "member" ? `<label class="role-switch record-switch"><span class="sr-only">Choose ${role} record</span><select id="workspace-record-select" data-workspace-role="${role}" aria-label="Choose ${role} record"><option value="">Choose ${role} record</option></select><span class="select-caret" aria-hidden="true">⌄</span></label>` : ""}
        <button class="icon-button search-toggle" aria-label="Search" title="Search is a layout preview">${icon("search")}</button>
        <button class="icon-button notification-button" aria-label="Notifications" title="Notifications">${icon("bell")}<span class="notification-dot"></span></button>
        <div class="topbar-user"><span class="avatar">${role === "admin" ? "IC" : role === "trainer" ? "TR" : "MB"}</span><span class="user-label"><strong>${config.label} workspace</strong><small>Public access</small></span></div>
      </div>
    </header>`;
}
