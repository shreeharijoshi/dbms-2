import { getReport } from "./api.js";
import { renderReport } from "../pages/reports.js";

let loadId = 0;

export function mountReportsPage() {
  const root = document.querySelector("#reports-page");
  if (!root) return;
  const form = root.querySelector("#report-filters");
  const state = root.querySelector("#report-state");
  const results = root.querySelector("#report-results");

  async function load(event) {
    event?.preventDefault();
    const thisLoad = ++loadId;
    const type = root.querySelector("#report-type").value;
    const from = root.querySelector("#report-from").value;
    const to = root.querySelector("#report-to").value;
    if (from && to && from > to) {
      state.textContent = "Start date must be on or before end date.";
      results.innerHTML = "";
      return;
    }
    state.textContent = "Loading report…";
    results.innerHTML = "";
    try {
      const report = await getReport(type, from, to);
      if (thisLoad !== loadId || !root.isConnected) return;
      state.textContent = `${report.rows.length} records`;
      results.innerHTML = renderReport(report);
    } catch (error) {
      if (thisLoad !== loadId || !root.isConnected) return;
      state.innerHTML = `<strong>Report unavailable</strong><p>${String(error.message).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])}</p>`;
    }
  }

  form.addEventListener("submit", load);
  root.querySelector("#report-print").addEventListener("click", () => window.print());
  load();
}
