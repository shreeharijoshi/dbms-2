import { icon } from "../components/icons.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const number = (value) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value || 0));
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export function adminDashboardPage() {
  return `<section id="analytics-dashboard" class="analytics-page" aria-live="polite">
    <header class="analytics-hero"><div><span class="eyebrow"><span class="live-dot"></span>ADMIN OVERVIEW</span><h1>Gym performance</h1><p>Operational and financial results from recorded gym data.</p></div><a class="analytics-link" href="#/admin/reports">Open reports ${icon("arrow")}</a></header>
    <div id="analytics-state" class="analytics-state">Loading dashboard data…</div><div id="analytics-results"></div>
  </section>`;
}

function withAxes(title, rows, xAxis, yAxis, content, subtitle = "") {
  return `<section class="analytics-card"><header class="analytics-card-head"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div></header><div class="analytics-chart-frame"><span class="analytics-axis-label analytics-axis-y">${escapeHtml(yAxis)}</span><div class="analytics-chart-body">${content}<span class="analytics-axis-label analytics-axis-x">${escapeHtml(xAxis)}</span></div></div></section>`;
}

function bars(title, rows, key, valueKey, xAxis, yAxis, format = number) {
  if (!rows?.length) return withAxes(title, rows, xAxis, yAxis, `<p class="analytics-empty">No records to display.</p>`);
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  const chart = `<div class="analytics-bars">${rows.map((row) => {
    const value = Number(row[valueKey] || 0);
    return `<div class="analytics-bar-item" title="${escapeHtml(row[key])}: ${escapeHtml(format(value))}"><div class="analytics-bar-value">${escapeHtml(format(value))}</div><div class="analytics-bar-track ${value < 0 ? "negative" : ""}"><span style="height:${Math.max(2, Math.abs(value) / max * 100)}%"></span></div><small>${escapeHtml(row[key])}</small></div>`;
  }).join("")}</div>`;
  return withAxes(title, rows, xAxis, yAxis, chart);
}

function stackChart(title, rows) {
  if (!rows?.length) return withAxes(title, rows, "Month", "Amount (INR)", `<p class="analytics-empty">No transaction records for this period.</p>`, "Monthly recorded payments and expenses.");
  const max = Math.max(1, ...rows.flatMap((row) => [Number(row.revenue || 0), Number(row.expenses || 0)]));
  const chart = `<div class="analytics-chart-bars analytics-grouped-bars">${rows.map((row) => `<div class="analytics-bar-item" title="${escapeHtml(row.month)} — Revenue: ${escapeHtml(currency(row.revenue))}; Expenses: ${escapeHtml(currency(row.expenses))}"><div class="grouped-track"><span class="revenue-bar" style="height:${Math.max(2, Number(row.revenue || 0) / max * 100)}%"></span><span class="expense-bar" style="height:${Math.max(2, Number(row.expenses || 0) / max * 100)}%"></span></div><small>${escapeHtml(row.month)}</small></div>`).join("")}</div>`;
  return `<section class="analytics-card analytics-card-wide"><header class="analytics-card-head"><div><h2>${escapeHtml(title)}</h2><p>Revenue is recorded payments; expenses include bonuses.</p></div><div class="analytics-legend"><span><i class="legend-revenue"></i>Revenue</span><span><i class="legend-expenses"></i>Expenses</span></div></header><div class="analytics-chart-frame"><span class="analytics-axis-label analytics-axis-y">Amount (INR)</span><div class="analytics-chart-body">${chart}<span class="analytics-axis-label analytics-axis-x">Month</span></div></div></section>`;
}

export function dashboardMarkup(data) {
  const summary = data.summary || {};
  const statistics = [
    ["Active members", summary.active_members, "users", "Current active memberships"],
    ["Available trainers", summary.total_trainers, "badge", "All trainers in the roster"],
    ["Membership plans", summary.total_plans, "layers", "Plans in the catalog"],
    ["Low stock items", summary.low_stock_items, "box", "At or below the stock threshold"],
  ];
  return `<section class="analytics-overview" aria-label="Important statistics">${statistics.map(([label, value, iconName, note]) => `<article class="analytics-stat"><div class="analytics-stat-head"><span>${escapeHtml(label)}</span>${icon(iconName, "analytics-stat-icon")}</div><strong>${escapeHtml(number(value))}</strong><small>${escapeHtml(note)}</small></article>`).join("")}</section>
  <div class="analytics-grid">
    ${stackChart("Monthly Revenue vs. Expenses", data.financial)}
    ${bars("Memberships by Plan", data.memberships.by_plan, "label", "count", "Membership plan", "Number of memberships")}
    ${bars("Members by Gender", data.members.by_gender, "label", "count", "Gender", "Number of members")}
    ${bars("Members by Assigned Trainer", data.members.by_trainer, "label", "count", "Trainer", "Number of members")}
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
