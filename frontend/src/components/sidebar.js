import { icon } from "./icons.js";
import { roles, routeFor } from "../navigation.js";

export function sidebar(role, page) {
  const config = roles[role];
  const links = config.links.map(([label, slug, iconName]) => `
    <a class="side-link ${page === slug ? "is-active" : ""}" href="${routeFor(role, slug)}" ${page === slug ? 'aria-current="page"' : ""}>
      ${icon(iconName)}<span>${label}</span>${page === slug ? '<span class="active-mark"></span>' : ""}
    </a>`).join("");

  return `
    <aside class="sidebar" id="sidebar" aria-label="${config.label} navigation">
      <a class="brand" href="${routeFor(role, "dashboard")}" aria-label="IronCore home">
        <span class="brand-mark">${icon("activity")}</span>
        <span class="brand-name">iron<span>core</span><small>GYM MANAGEMENT</small></span>
      </a>
      <div class="sidebar-section-label">WORKSPACE</div>
      <nav class="side-nav">${links}</nav>
      <div class="sidebar-bottom">
        <div class="sidebar-tip"><span class="tip-icon">${icon("activity")}</span><strong>Stronger together</strong><p>Every great result starts with showing up.</p></div>
        <div class="sidebar-version">IRONCORE <span>•</span> WORKSPACE</div>
      </div>
    </aside>
    <button class="sidebar-scrim" data-action="close-menu" aria-label="Close navigation"></button>`;
}
