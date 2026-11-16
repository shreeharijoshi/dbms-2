import { icon } from "./icons.js";
import { roles } from "../navigation.js";

export function topbar(page) {
  const config = roles.admin;
  const title = config.links.find((item) => item[1] === page)?.[0] || "Dashboard";
  return `
    <header class="topbar">
      <button class="icon-button menu-toggle" data-action="open-menu" aria-label="Open navigation">${icon("menu")}</button>
      <div class="breadcrumbs"><span>Workspace</span><span class="crumb-divider">/</span><strong>${title}</strong></div>
      <div class="topbar-actions">
        <button class="icon-button search-toggle" aria-label="Search" title="Search is a layout preview">${icon("search")}</button>
        <button class="icon-button notification-button" aria-label="Notifications" title="Notifications">${icon("bell")}<span class="notification-dot"></span></button>
        <div class="topbar-user"><span class="avatar">IC</span><span class="user-label"><strong>Admin workspace</strong><small>Public access</small></span></div>
      </div>
    </header>`;
}
