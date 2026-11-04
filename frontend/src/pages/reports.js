const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const reportTypes = [
  ["daily-revenue", "Daily revenue"], ["monthly-revenue", "Monthly revenue"], ["monthly-expenses", "Monthly expenses"],
  ["profit-loss", "Profit / loss"], ["memberships", "Membership report"], ["payment-modes", "Payment mode report"],
  ["trainer-expenses", "Trainer expense report"], ["inventory-expenses", "Inventory expense report"],
];

export function reportsPage() {
  return `<section class="analytics-page" id="reports-page"><header class="analytics-hero"><div><span class="eyebrow"><span class="live-dot"></span>ADMIN REPORTS</span><h1>Reports</h1><p>Filter transaction and membership reports by date range, then print the results.</p></div></header>
    <form class="report-filters" id="report-filters"><label>Report<select id="report-type">${reportTypes.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><label>From<input id="report-from" type="date"></label><label>To<input id="report-to" type="date"></label><button class="analytics-button" type="submit">Run report</button><button class="analytics-button analytics-button-light" type="button" id="report-print">Print</button></form>
    <div class="report-method-note">Revenue = sum of recorded payments. Expenses = expense amount plus bonus. Inventory expense includes only expense rows linked to inventory; inventory stock valuation is not treated as cash expense.</div>
    <div id="report-state" class="analytics-state">Choose a report and run it.</div><section id="report-results"></section>
  </section>`;
}

function format(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  return value;
}

export function renderReport(report) {
  if (!report.rows.length) return `<article class="report-card"><div class="report-card-head"><div><h2>${escapeHtml(report.title)}</h2><p>${escapeHtml(report.description)}</p></div></div><p class="analytics-empty">No records found for this report and date range.</p></article>`;
  const columns = Object.keys(report.rows[0]);
  return `<article class="report-card"><div class="report-card-head"><div><h2>${escapeHtml(report.title)}</h2><p>${escapeHtml(report.description)}</p></div><span>${report.rows.length} rows</span></div><div class="analytics-table-wrap"><table class="analytics-table"><thead><tr>${columns.map((key) => `<th>${escapeHtml(key.replaceAll("_", " "))}</th>`).join("")}</tr></thead><tbody>${report.rows.map((row) => `<tr>${columns.map((key) => `<td>${escapeHtml(format(row[key]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>`;
}
