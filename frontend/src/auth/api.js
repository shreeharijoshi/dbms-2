const API_BASE_URL = (window.GYM_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class AuthApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new AuthApiError("Unable to reach the sign-in service. Check that the API is running.", 0);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // A non-JSON error body is handled by the status fallback below.
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(" ")
      : data.detail;
    const fallback = response.status === 503
      ? "The authentication service is temporarily unavailable. Try again."
      : "The request could not be completed. Try again.";
    throw new AuthApiError(detail || fallback, response.status);
  }
  return data;
}

export function loginRequest(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function currentUserRequest(token) {
  return request("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logoutRequest(token) {
  return request("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
