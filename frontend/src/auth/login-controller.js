import { AuthApiError, loginRequest, logoutRequest } from "./api.js";
import { dashboardPathForRole } from "./route-guard.js";
import { clearSession, getAccessToken, saveSession, setAuthNotice } from "./store.js";

export async function submitLoginForm(form) {
  const email = form.elements.email;
  const password = form.elements.password;
  const emailError = !email.value.trim()
    ? "Enter your email address."
    : !email.validity.valid
      ? "Enter a valid email address."
      : "";
  const passwordError = password.value.length === 0 ? "Enter your password." : "";
  setFieldError(email, emailError);
  setFieldError(password, passwordError);
  const message = form.querySelector("#login-message");
  message.textContent = "";
  message.className = "login-message";
  if (emailError || passwordError) {
    (emailError ? email : password).focus();
    return;
  }

  form.classList.add("is-loading");
  form.querySelector(".login-submit").disabled = true;
  form.setAttribute("aria-busy", "true");
  message.textContent = "Signing in...";
  try {
    const session = await loginRequest(email.value.trim(), password.value);
    const destination = dashboardPathForRole(session.user?.role);
    if (destination === "#/login") {
      throw new AuthApiError("The server returned an unrecognized account role.", 500);
    }
    saveSession(session);
    window.location.hash = destination;
  } catch (error) {
    message.className = "login-message is-error";
    message.textContent = error.message || "Sign in failed. Try again.";
    form.classList.remove("is-loading");
    form.querySelector(".login-submit").disabled = false;
    form.removeAttribute("aria-busy");
  }
}

export async function signOut() {
  const token = getAccessToken();
  let notice = "You have been signed out.";
  if (token) {
    try {
      await logoutRequest(token);
    } catch (error) {
      if (error.status !== 401) {
        notice = "Signed out on this device, but the server could not confirm session revocation.";
      }
    }
  }
  clearSession();
  setAuthNotice(notice);
  window.location.hash = "#/login";
}

export function clearLoginFieldError(input) {
  const message = input.type === "email"
    ? (!input.value.trim() ? "" : input.validity.valid ? "" : "Enter a valid email address.")
    : (!input.value ? "" : "");
  setFieldError(input, message);
}

function setFieldError(input, message) {
  const field = input.closest(".form-field");
  field.classList.toggle("has-error", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  field.querySelector(".field-error").textContent = message;
}
