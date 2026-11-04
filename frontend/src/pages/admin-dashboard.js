import { icon } from "../components/icons.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const number = (value) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value || 0));
const money = (value) => new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export function adminDashboardPage() {
  return `<section id="analytics-dashboard" class="analytics-page" aria-live="polite">
    <header class="analytics-hero"><div><span class="eyebrow"><span class="live-dot"></span>ADMIN OVERVIEW</span><h1>Gym performance</h1><p>Operational and financial results from recorded gym data.</p></div><a class="analytics-link" href="#/admin/reports">Open reports ${icon("arrow")}</a></header>
    <div id="analytics-state" class="analytics-state">Loading dashboard data…</div><div id="analytics-results"></div>
  </section>`;
}

function metric(label, value, note, color) {
  return `<article class="analytics-metric"><span>${escapeHtml(label)}</span><strong class="${color || ""}">${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
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
  const max = Math.max(1, ...rows.flatMap((row) => [Number(row.revenue || 0), Number(row.expenses || 0), Math.abs(Number(row.profit || 0))]));
  return `<section class="analytics-card analytics-card-wide"><div class="analytics-card-head"><div><h2>${escapeHtml(title)}</h2><p>Revenue is recorded payments; expenses include bonuses.</p></div><div class="analytics-legend"><span><i class="legend-revenue"></i>Revenue</span><span><i class="legend-expenses"></i>Expenses</span></div></div><div class="analytics-bars grouped-bars">${rows.map((row) => `<div class="analytics-bar-item"><div class="grouped-track"><span class="revenue-bar" style="height:${Math.max(2, Number(row.revenue || 0) / max * 100)}%"></span><span class="expense-bar" style="height:${Math.max(2, Number(row.expenses || 0) / max * 100)}%"></span></div><small>${escapeHtml(row.month)}</small><b class="profit-label ${Number(row.profit) < 0 ? "negative" : ""}">${escapeHtml(money(row.profit))}</b></div>`).join("")}</div></section>`;
}

function listTable(title, rows, columns) {
  return `<section class="analytics-card"><h2>${escapeHtml(title)}</h2>${rows?.length ? `<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr>${columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.format ? c.format(row[c.key]) : row[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="analytics-empty">No records.</p>`}</section>`;
}

export function dashboardMarkup(data) {
  const s = data.summary;
  const cards = [
    ["Registered members", number(s.total_members), "All member records"],
    ["Active members", number(s.active_members), "Member status is Active"],
    ["Inactive members", number(s.inactive_members), "Member status is not Active"],
    ["Trainers", number(s.total_trainers), "Trainer records"],
    ["Membership plans", number(s.total_plans), "Available plans"],
    ["Total revenue", money(s.total_revenue), "Recorded payment amounts"],
    ["Total expenses", money(s.total_expenses), "Amount plus expense bonuses"],
    ["Net profit", money(s.net_profit), "Revenue less recorded expenses"],
    ["Expiring in 7 days", number(s.expiring_memberships), "Active subscriptions by end date"],
    ["Low stock", number(s.low_stock_items), `Quantity at or below ${data.inventory.low_stock_threshold}`],
  ];
  const m = data.memberships;
  const registration = data.members.registration_timeline;
  return `<div class="analytics-metrics">${cards.map((c) => metric(...c)).join("")}</div>
    <div class="analytics-grid">${stackChart("Monthly revenue versus expenses", data.financial)}
      ${bars("Monthly revenue", data.financial, "month", "revenue", money)}
      ${bars("Monthly expenses", data.financial, "month", "expenses", money)}
      ${bars("Monthly profit / loss", data.financial, "month", "profit", money)}
      ${bars("Payment distribution by mode", data.payment_modes, "label", "total", money)}
      ${bars("Membership status", m.status, "label", "count")}
      ${bars("Membership distribution by plan", m.by_plan, "label", "count")}
      ${bars("Monthly new subscriptions", m.subscriptions_by_month, "month", "count")}
      ${listTable("Memberships expiring within seven days", m.expiring, [{ key: "member_name", label: "Member" }, { key: "member_id", label: "Member ID" }, { key: "plan_id", label: "Plan" }, { key: "end_date", label: "Expires" }, { key: "days_remaining", label: "Days left" }])}
      ${bars("Members by gender", data.members.by_gender, "label", "count")}
      ${bars("Members by assigned trainer", data.members.by_trainer, "label", "count")}
      ${bars("Inventory by category", data.inventory.by_category, "label", "count")}
      <section class="analytics-card"><h2>New member registrations</h2><p class="analytics-empty">${escapeHtml(registration.reason)}</p></section>
      ${listTable("Low-stock inventory", data.inventory.low_stock, [{ key: "inventory_id", label: "ID" }, { key: "item_name", label: "Item" }, { key: "category", label: "Category" }, { key: "quantity", label: "Qty" }])}
      <section class="analytics-card"><h2>Inventory purchase expenditure</h2><strong class="analytics-inventory-value">${escapeHtml(money(data.inventory.recorded_stock_cost))}</strong><p class="analytics-note">${escapeHtml(data.inventory.purchase_expenditure_note)}</p><p class="analytics-note">${number(data.inventory.total_items)} items · ${number(data.inventory.total_quantity)} total units</p></section>
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
