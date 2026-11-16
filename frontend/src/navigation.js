export const roles = {
  admin: {
    label: "Admin",
    description: "Manage your gym operations",
    links: [
      ["Dashboard", "dashboard", "grid"],
      ["Members", "members", "users"],
      ["Trainers", "trainers", "dumbbell"],
      ["Membership Plans", "membership-plans", "layers"],
      ["Subscriptions", "subscriptions", "calendar"],
      ["Payments", "payments", "credit-card"],
      ["Expenses", "expenses", "receipt"],
      ["Inventory", "inventory", "box"],
      ["Employees", "employees", "badge"],
      ["Reports", "reports", "chart"],
    ],
  },
};

export function routeFor(_role, page) {
  return `#/admin/${page}`;
}

export function parseRoute(hash = window.location.hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const isAdminRoute = parts[0] === "admin";
  const requestedPage = isAdminRoute ? parts[1] || "dashboard" : "dashboard";
  const item = roles.admin.links.find((link) => link[1] === requestedPage);
  const adminUtilityPage = ["enroll-member", "expiring-memberships"].includes(requestedPage);
  const page = item || adminUtilityPage ? requestedPage : "dashboard";
  return {
    name: "app",
    role: "admin",
    page,
    memberId: page === "members" ? parts[2] || null : null,
    trainerId: page === "trainers" ? parts[2] || null : null,
    trainerMemberId: null,
    subscriptionMemberId: page === "subscriptions" && parts[2] === "member" ? parts[3] || null : null,
    paymentMemberId: page === "payments" && parts[2] === "member" ? parts[3] || null : null,
    enrollMemberId: page === "enroll-member" ? parts[2] || null : null,
  };
}
