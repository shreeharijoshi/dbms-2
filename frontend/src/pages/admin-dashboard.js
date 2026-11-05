import { icon } from "../components/icons.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const number = (value) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value || 0));

export function adminDashboardPage() {
  return `<section id="analytics-dashboard" class="analytics-page" aria-live="polite">
    <header class="analytics-hero"><div><span class="eyebrow"><span class="live-dot"></span>ADMIN OVERVIEW</span><h1>Gym performance</h1><p>Operational and financial results from recorded gym data.</p></div><a class="analytics-link" href="#/admin/reports">Open reports ${icon("arrow")}</a></header>
    <div id="analytics-state" class="analytics-state">Loading dashboard data…</div><div id="analytics-results"></div>
  </section>`;
}

function bars(title, rows, key, valueKey, format = number) {
  if (!rows?.length) return `<section class="analytics-card"><h2>${escapeHtml(title)}</h2><p class="analytics-empty">No records for this period.</p></section>`;
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  return `<section class="analytics-card"><h2>${escapeHtml(title)}</h2><div class="analytics-bars">${rows.map((row) => {
    const value = Number(row[valueKey] || 0);
    return `<div class="analytics-bar-item" title="${escapeHtml(row[key])}: ${escapeHtml(format(value))}"><div class="analytics-bar-value">${escapeHtml(format(value))}</div><div class="analytics-bar-track ${value < 0 ? "negative" : ""}"><span style="height:${Math.max(2, Math.abs(value) / max * 100)}%"></span></div><small>${escapeHtml(row[key])}</small></div>`;
  }).join("")}</div></section>`;
}

function stackChart(title, rows) {
  if (!rows?.length) return `<section class="analytics-card"><h2>${escapeHtml(title)}</h2><p class="analytics-empty">No transaction records for this period.</p></section>`;
  const max = Math.max(1, ...rows.flatMap((row) => [Number(row.revenue || 0), Number(row.expenses || 0)]));
  return `<section class="analytics-card analytics-card-wide"><div class="analytics-card-head"><div><h2>${escapeHtml(title)}</h2><p>Revenue is recorded payments; expenses include bonuses.</p></div><div class="analytics-legend"><span><i class="legend-revenue"></i>Revenue</span><span><i class="legend-expenses"></i>Expenses</span></div></div><div class="analytics-bars grouped-bars">${rows.map((row) => `<div class="analytics-bar-item"><div class="grouped-track"><span class="revenue-bar" style="height:${Math.max(2, Number(row.revenue || 0) / max * 100)}%"></span><span class="expense-bar" style="height:${Math.max(2, Number(row.expenses || 0) / max * 100)}%"></span></div><small>${escapeHtml(row.month)}</small></div>`).join("")}</div></section>`;
}

export function dashboardMarkup(data) {
  return `<div class="analytics-grid">
    ${stackChart("Monthly revenue versus expenses", data.financial)}
    ${bars("Membership distribution by plan", data.memberships.by_plan, "label", "count")}
    ${bars("Members by gender", data.members.by_gender, "label", "count")}
    ${bars("Members by assigned trainer", data.members.by_trainer, "label", "count")}
  </div>`;
}

export function mountAdminDashboard() {
  const root = document.querySelector("#analytics-dashboard");
  if (!root) return;
  import("../analytics/api.js").then(({ getAnalytics }) => getAnalytics()).then((data) => {
    if (!root.isConnected) return;
    root.querySelector("#analytics-state").remove();
    root.querySelector("#analytics-results").innerHTML = dashboardMarkup(data);
  }).catch((error) => {
    if (!root.isConnected) return;
    root.querySelector("#analytics-state").innerHTML = `<strong>Dashboard data unavailable</strong><p>${escapeHtml(error.message)}</p><button class="analytics-button" data-analytics-retry>Try again</button>`;
    root.querySelector("[data-analytics-retry]")?.addEventListener("click", () => mountAdminDashboard());
  });
}
