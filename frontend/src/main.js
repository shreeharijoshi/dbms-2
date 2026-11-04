import { renderRoute } from "./routes/router.js";
import { saveWorkspaceRecord } from "./workspace/selection.js";
import { closeMemberDialogOnEscape, handleMemberChange, handleMemberClick, handleMemberInput, handleMemberSubmit } from "./members/page-controller.js";
import { closeTrainerDialogOnEscape, handleTrainerChange, handleTrainerClick, handleTrainerInput, handleTrainerSubmit } from "./trainers/page-controller.js";
import { closePlanDialogOnEscape, handlePlanChange, handlePlanClick, handlePlanInput, handlePlanSubmit } from "./membership-plans/page-controller.js";
import { closeSubscriptionDialogOnEscape, handleSubscriptionChange, handleSubscriptionClick, handleSubscriptionInput, handleSubscriptionSubmit } from "./subscriptions/page-controller.js";
import { closePaymentDialogOnEscape, handlePaymentChange, handlePaymentClick, handlePaymentInput, handlePaymentSubmit } from "./payments/page-controller.js";
import { closeExpenseDialogOnEscape, handleExpenseChange, handleExpenseClick, handleExpenseInput, handleExpenseSubmit } from "./expenses/page-controller.js";
import { closeInventoryDialogOnEscape, handleInventoryChange, handleInventoryClick, handleInventoryInput, handleInventorySubmit } from "./inventory/page-controller.js";
import { closeEmployeeDialogOnEscape, handleEmployeeChange, handleEmployeeClick, handleEmployeeInput, handleEmployeeSubmit } from "./employees/page-controller.js";
import { handleTrainerPortalClick, handleTrainerPortalInput } from "./trainer-portal/page-controller.js";
import { closeMemberPortalDialogOnEscape, handleMemberPortalClick, handleMemberPortalSubmit } from "./member-portal/page-controller.js";

renderRoute();
window.addEventListener("hashchange", renderRoute);

document.addEventListener("click", (event) => {
  handleMemberClick(event);
  handleTrainerClick(event);
  handlePlanClick(event);
  handleSubscriptionClick(event);
  handlePaymentClick(event);
  handleExpenseClick(event);
  handleInventoryClick(event);
  handleEmployeeClick(event);
  handleTrainerPortalClick(event);
  handleMemberPortalClick(event);
  const control = event.target.closest("[data-action]");
  const action = control?.dataset.action;
  if (action === "open-menu") document.body.classList.add("menu-open");
  if (action === "close-menu") document.body.classList.remove("menu-open");
  if (event.target.closest(".side-link")) document.body.classList.remove("menu-open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.body.classList.remove("menu-open");
  closeMemberDialogOnEscape(event);
  closeTrainerDialogOnEscape(event);
  closePlanDialogOnEscape(event);
  closeSubscriptionDialogOnEscape(event);
  closePaymentDialogOnEscape(event);
  closeExpenseDialogOnEscape(event);
  closeInventoryDialogOnEscape(event);
  closeEmployeeDialogOnEscape(event);
  closeMemberPortalDialogOnEscape(event);
});

document.addEventListener("input", (event) => {
  handleMemberInput(event);
  handleTrainerInput(event);
  handlePlanInput(event);
  handleSubscriptionInput(event);
  handlePaymentInput(event);
  handleExpenseInput(event);
  handleInventoryInput(event);
  handleEmployeeInput(event);
  handleTrainerPortalInput(event);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#workspace-role-select")) {
    window.location.hash = `#/${event.target.value}/dashboard`;
    return;
  }
  if (event.target.matches("#workspace-record-select")) {
    saveWorkspaceRecord(event.target.dataset.workspaceRole, event.target.value);
    renderRoute();
    return;
  }
  handleMemberChange(event);
  handleTrainerChange(event);
  handlePlanChange(event);
  handleSubscriptionChange(event);
  handlePaymentChange(event);
  handleExpenseChange(event);
  handleInventoryChange(event);
  handleEmployeeChange(event);
});

document.addEventListener("submit", (event) => {
  handleMemberSubmit(event);
  handleTrainerSubmit(event);
  handlePlanSubmit(event);
  handleSubscriptionSubmit(event);
  handlePaymentSubmit(event);
  handleExpenseSubmit(event);
  handleInventorySubmit(event);
  handleEmployeeSubmit(event);
  handleMemberPortalSubmit(event);
});
