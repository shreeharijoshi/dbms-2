import { currentUserRequest } from "./api.js";
import { clearSession, getAccessToken, updateStoredUser } from "./store.js";

export function dashboardPathForRole(role) {
  const routeRole = { Admin: "admin", Trainer: "trainer", Member: "member" }[role];
  return routeRole ? `#/${routeRole}/dashboard` : "#/login";
}

export function roleRedirectForRoute(user, requestedRole) {
  const destination = dashboardPathForRole(user?.role);
  if (destination === "#/login") return destination;
  const accountRole = destination.split("/")[1];
  return accountRole === requestedRole ? null : destination;
}

export async function validateCurrentSession() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const user = await currentUserRequest(token);
    updateStoredUser(user);
    return user;
  } catch (error) {
    if (error.status === 401) clearSession();
    throw error;
  }
}
