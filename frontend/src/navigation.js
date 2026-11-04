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
  trainer: {
    label: "Trainer",
    description: "Your coaching workspace",
    links: [
      ["Dashboard", "dashboard", "grid"],
      ["My Members", "my-members", "users"],
      ["My Profile", "my-profile", "user"],
    ],
  },
  member: {
    label: "Member",
    description: "Your fitness, all in one place",
    links: [
      ["Dashboard", "dashboard", "grid"],
      ["My Profile", "my-profile", "user"],
      ["My Membership", "my-membership", "layers"],
      ["My Payments", "my-payments", "credit-card"],
      ["My Trainer", "my-trainer", "dumbbell"],
    ],
  },
};

export function routeFor(role, page) {
  return `#/${role}/${page}`;
}

export function parseRoute(hash = window.location.hash) {
  if (!hash || hash === "#") return { name: "login" };
  if (hash.replace(/\/$/, "") === "#/login") return { name: "login" };
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const role = roles[parts[0]] ? parts[0] : "admin";
  const page = parts[1] || "dashboard";
  const item = roles[role].links.find((link) => link[1] === page);
  const adminUtilityPage = role === "admin" && ["enroll-member", "expiring-memberships"].includes(page);
  return {
    name: "app",
    role,
    page: item || adminUtilityPage ? page : "dashboard",
    memberId: role === "admin" && page === "members" ? parts[2] || null : null,
    trainerId: role === "admin" && page === "trainers" ? parts[2] || null : null,
    trainerMemberId: role === "trainer" && page === "my-members" ? parts[2] || null : null,
    subscriptionMemberId: role === "admin" && page === "subscriptions" && parts[2] === "member" ? parts[3] || null : null,
    paymentMemberId: role === "admin" && page === "payments" && parts[2] === "member" ? parts[3] || null : null,
    enrollMemberId: role === "admin" && page === "enroll-member" ? parts[2] || null : null,
  };
}
