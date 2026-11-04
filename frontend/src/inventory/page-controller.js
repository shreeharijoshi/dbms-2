import { createInventoryItem, deleteInventoryItem, getInventory, getInventoryFilters, getInventoryItem, getInventorySummary, updateInventoryItem, updateInventoryQuantity } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { inventoryForm, inventorySummary, inventoryTable, quantityForm } from "../pages/inventory.js";

let page = 0;
let total = 0;
let threshold = 5;
let timer;
let loading = 0;

function modalRoot() { let root = document.querySelector("#inventory-dialog-root"); if (!root) { root = document.createElement("div"); root.id = "inventory-dialog-root"; document.body.append(root); } return root; }

async function refresh() {
  const root = document.querySelector("#inventory-page");
  if (!root) return;
  const requestId = ++loading;
  const results = root.querySelector("#inventory-results");
  const count = root.querySelector("#inventory-count");
  results.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading inventory…</div>';
  try {
    const filters = { search: root.querySelector("#inventory-search").value.trim(), category: root.querySelector("#inventory-category").value, inventory_status: root.querySelector("#inventory-status").value, low_stock: root.querySelector("#inventory-low-stock").checked ? "true" : "", skip: page * 100, limit: 100 };
    const response = await getInventory(filters);
    if (requestId !== loading || !root.isConnected) return;
    total = response.total; count.textContent = `${total} ${total === 1 ? "item" : "items"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${inventoryTable(response.items, threshold)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="inventory-page-prev" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="inventory-page-next" ${page + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== loading || !root.isConnected) return;
    count.textContent = "Inventory unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load inventory</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-inventory">Try again</button></div>`;
  }
}

export async function mountInventoryPage() {
  const root = document.querySelector("#inventory-page");
  if (!root) return;
  page = 0;
  const requestId = ++loading;
  try {
    const [summary, filters] = await Promise.all([getInventorySummary(), getInventoryFilters()]);
    if (requestId !== loading || !root.isConnected) return;
    threshold = summary.low_stock_threshold;
    root.querySelector("#inventory-summary").innerHTML = inventorySummary(summary);
    root.querySelector("#inventory-category").insertAdjacentHTML("beforeend", filters.categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join(""));
    root.querySelector("#inventory-status").insertAdjacentHTML("beforeend", filters.statuses.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join(""));
    await refresh();
  } catch (error) {
    if (!root.isConnected) return;
    root.querySelector("#inventory-summary").innerHTML = `<div class="member-state member-error"><strong>Unable to load inventory summary</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-inventory">Try again</button></div>`;
  }
}

export function handleInventoryInput(event) {
  if (!event.target.matches("#inventory-search")) return;
  page = 0; clearTimeout(timer); timer = setTimeout(refresh, 250);
}

export function handleInventoryChange(event) {
  if (event.target.matches("#inventory-category, #inventory-status, #inventory-low-stock")) { page = 0; refresh(); }
}

export async function handleInventoryClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "add-inventory") { modalRoot().innerHTML = inventoryForm(); modalRoot().querySelector('[name="purchase_date"]').value = new Date().toLocaleDateString("en-CA"); }
  if (action === "close-inventory-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().replaceChildren();
  if (action === "edit-inventory" || action === "adjust-inventory") {
    control.disabled = true;
    try {
      const item = await getInventoryItem(control.dataset.inventoryId);
      modalRoot().innerHTML = action === "edit-inventory" ? inventoryForm(item) : quantityForm(item);
    } catch (error) { window.alert(error.message); }
    finally { control.disabled = false; }
  }
  if (action === "delete-inventory" && window.confirm(`Delete inventory item ${control.dataset.inventoryId}? Items referenced by expense records cannot be deleted.`)) {
    control.disabled = true;
    deleteInventoryItem(control.dataset.inventoryId).then(mountInventoryPage).catch((error) => { window.alert(error.message); control.disabled = false; });
  }
  if (action === "retry-inventory") mountInventoryPage();
  if (action === "reset-inventory-filters") {
    const root = document.querySelector("#inventory-page");
    for (const selector of ["#inventory-search", "#inventory-category", "#inventory-status"]) root.querySelector(selector).value = "";
    root.querySelector("#inventory-low-stock").checked = false; page = 0; refresh();
  }
  if (action === "inventory-page-prev" && page > 0) { page -= 1; refresh(); }
  if (action === "inventory-page-next" && (page + 1) * 100 < total) { page += 1; refresh(); }
}

export async function handleInventorySubmit(event) {
  const form = event.target;
  if (!form.matches("#inventory-form, #inventory-quantity-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".member-form-feedback");
  submit.disabled = true; submit.querySelector("span").textContent = "Saving…"; feedback.textContent = "";
  try {
    if (form.id === "inventory-quantity-form") await updateInventoryQuantity(form.dataset.inventoryId, Number(data.quantity));
    else {
      data.quantity = Number(data.quantity); data.cost = Number(data.cost);
      if (form.dataset.inventoryId) { delete data.inventory_id; await updateInventoryItem(form.dataset.inventoryId, data); }
      else await createInventoryItem(data);
    }
    modalRoot().replaceChildren(); await mountInventoryPage();
  } catch (error) { feedback.textContent = error.message; submit.disabled = false; submit.querySelector("span").textContent = form.id === "inventory-quantity-form" ? "Update stock" : form.dataset.inventoryId ? "Save changes" : "Add item"; }
}

export function closeInventoryDialogOnEscape(event) { if (event.key === "Escape") modalRoot().replaceChildren(); }
