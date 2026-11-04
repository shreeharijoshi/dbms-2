export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}`.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
