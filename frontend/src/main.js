import { clearLoginFieldError, signOut, submitLoginForm } from "./auth/login-controller.js";
import { renderRoute } from "./routes/router.js";
import { icon } from "./components/icons.js";
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
  if (action === "logout") signOut();
  if (action === "toggle-password") {
    const password = document.querySelector("#login-password");
    if (password) {
      const showing = password.type === "password";
      password.type = showing ? "text" : "password";
      control.setAttribute("aria-label", showing ? "Hide password" : "Show password");
      control.setAttribute("aria-pressed", String(showing));
      control.innerHTML = icon(showing ? "eye-off" : "eye");
    }
  }
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
  if (event.target.matches("#login-email, #login-password")) {
    clearLoginFieldError(event.target);
  }
});

document.addEventListener("change", (event) => {
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
  if (event.target.matches("#login-form")) {
    event.preventDefault();
    submitLoginForm(event.target);
    return;
  }
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
