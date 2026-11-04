import { createPayment, getMemberPayments, getPayment, getPaymentOptions, getPayments } from "./api.js";
import { escapeHtml } from "../members/html.js";
import { money, paymentDetails, paymentForm, paymentTable } from "../pages/payments.js";

let page = 0;
let total = 0;
let timer;
let loading = 0;
let receipt;

function modalRoot() {
  let root = document.querySelector("#payment-dialog-root");
  if (!root) { root = document.createElement("div"); root.id = "payment-dialog-root"; document.body.append(root); }
  return root;
}

async function refresh() {
  const root = document.querySelector("#payments-page");
  if (!root) return;
  const requestId = ++loading;
  const results = root.querySelector("#payment-results");
  const count = root.querySelector("#payment-count");
  results.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading payments…</div>';
  const filters = { search: root.querySelector("#payment-search").value.trim(), payment_mode: root.querySelector("#payment-mode").value, date_from: root.querySelector("#payment-date-from")?.value || "", date_to: root.querySelector("#payment-date-to")?.value || "", skip: page * 100, limit: 100 };
  try {
    const response = root.dataset.memberId ? await getMemberPayments(root.dataset.memberId, filters) : await getPayments(filters);
    if (requestId !== loading || !root.isConnected) return;
    total = response.total;
    count.textContent = `${total} ${total === 1 ? "payment" : "payments"} found`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${paymentTable(response.items)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="payment-page-prev" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="payment-page-next" ${page + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (requestId !== loading || !root.isConnected) return;
    count.textContent = "Payments unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load payments</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-payments">Try again</button></div>`;
  }
}

export function mountPaymentsPage() { page = 0; return refresh(); }

export function handlePaymentInput(event) {
  if (!event.target.matches("#payment-search")) return;
  page = 0; clearTimeout(timer); timer = setTimeout(refresh, 250);
}

export function handlePaymentChange(event) {
  if (!event.target.matches("#payment-mode, #payment-date-from, #payment-date-to")) return;
  page = 0; refresh();
}

export async function handlePaymentClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "add-payment") {
    try { modalRoot().innerHTML = paymentForm(await getPaymentOptions()); modalRoot().querySelector('[name="payment_date"]').value = new Date().toLocaleDateString("en-CA"); }
    catch (error) { window.alert(error.message); }
  }
  if (action === "close-payment-modal" && (control === event.target || control.classList.contains("member-modal-close"))) modalRoot().replaceChildren();
  if (action === "view-payment") {
    control.disabled = true;
    try { receipt = await getPayment(control.dataset.paymentId); modalRoot().innerHTML = paymentDetails(receipt); }
    catch (error) { window.alert(error.message); }
    finally { control.disabled = false; }
  }
  if (action === "print-payment" && receipt) printReceipt(receipt);
  if (action === "retry-payments") refresh();
  if (action === "reset-payment-filters") {
    const root = document.querySelector("#payments-page");
    root.querySelector("#payment-search").value = "";
    root.querySelector("#payment-mode").value = "";
    root.querySelector("#payment-date-from") && (root.querySelector("#payment-date-from").value = "");
    root.querySelector("#payment-date-to") && (root.querySelector("#payment-date-to").value = "");
    page = 0; refresh();
  }
  if (action === "payment-page-prev" && page > 0) { page -= 1; refresh(); }
  if (action === "payment-page-next" && (page + 1) * 100 < total) { page += 1; refresh(); }
}

export async function handlePaymentSubmit(event) {
  const form = event.target;
  if (!form.matches("#payment-form")) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  data.amount = Number(data.amount);
  const submit = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".member-form-feedback");
  submit.disabled = true; submit.querySelector("span").textContent = "Recording…"; feedback.textContent = "";
  try {
    const payment = await createPayment(data);
    receipt = payment;
    modalRoot().innerHTML = paymentDetails(payment);
    await refresh();
  } catch (error) { feedback.textContent = error.message; submit.disabled = false; submit.querySelector("span").textContent = "Record payment"; }
}

function printReceipt(payment) {
  const popup = window.open("", "_blank", "width=720,height=760");
  if (!popup) { window.alert("Allow pop-ups to print the receipt."); return; }
  const escape = (value) => escapeHtml(value ?? "—");
  popup.document.write(`<!doctype html><html><head><title>Receipt ${escape(payment.payment_id)}</title><meta charset="utf-8"><style>body{font:15px Arial,sans-serif;color:#263244;padding:36px}.receipt{max-width:620px;margin:auto;border:1px solid #dfe4ea;padding:30px}.brand{color:#d96d48;font-weight:bold;letter-spacing:2px}.rule{border:0;border-top:1px solid #e7ebf0;margin:22px 0}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eff1f4}.amount{font-size:25px;font-weight:bold}</style></head><body><main class="receipt"><div class="brand">IRONCORE · GYM MANAGEMENT</div><h1>Payment receipt</h1><p>Receipt ID: <strong>${escape(payment.payment_id)}</strong></p><hr class="rule"><div class="row"><span>Member</span><strong>${escape(payment.member_name)} (${escape(payment.member_id)})</strong></div><div class="row"><span>Plan</span><strong>${escape(payment.plan_id)}</strong></div><div class="row"><span>Payment date</span><strong>${escape(payment.payment_date)}</strong></div><div class="row"><span>Payment mode</span><strong>${escape(payment.payment_mode)}</strong></div><div class="row"><span>Total paid</span><strong class="amount">${escape(money(payment.amount))}</strong></div><hr class="rule"><p>Thank you for your payment.</p></main><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}

export function closePaymentDialogOnEscape(event) { if (event.key === "Escape") modalRoot().replaceChildren(); }
