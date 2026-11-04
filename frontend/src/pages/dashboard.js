import { icon } from "../components/icons.js";
import { roles } from "../navigation.js";

const roleCopy = {
  admin: ["Good morning", "Here’s your gym at a glance. Your workspace is ready to manage members, teams, and day-to-day operations."],
  trainer: ["Welcome back", "Your coaching workspace is ready. Keep track of your members and manage your profile."],
  member: ["Welcome to IronCore", "Your fitness workspace is ready. View your membership, payment history, and trainer details."],
};

function statCard(label, iconName, tone) {
  return `<article class="stat-card"><div class="stat-card-top"><span>${label}</span><span class="stat-icon ${tone}">${icon(iconName)}</span></div><strong class="stat-value">—</strong><span class="stat-note">Connect your workspace data</span></article>`;
}

export function dashboard(role) {
  const [greeting, description] = roleCopy[role];
  const cardNames = role === "admin" ? ["Total members", "Active subscriptions", "Monthly revenue"] : role === "trainer" ? ["My members", "Sessions this week", "Member progress"] : ["My membership", "Next payment", "My trainer"];
  const cardIcons = ["users", "calendar", "chart"];
  return `
    <section class="welcome-panel">
      <div class="welcome-copy"><span class="eyebrow"><span class="live-dot"></span>${roles[role].label.toUpperCase()} OVERVIEW</span><h1>${greeting}<span class="greeting-period">.</span></h1><p>${description}</p></div>
      <div class="welcome-art" aria-hidden="true"><div class="art-ring art-ring-one"></div><div class="art-ring art-ring-two"></div><div class="art-orbit"></div><div class="art-center">${icon("dumbbell")}</div><span class="art-spark spark-one">✦</span><span class="art-spark spark-two">✦</span></div>
    </section>
    <div class="section-heading"><div><span class="eyebrow muted-eyebrow">YOUR WORKSPACE</span><h2>At a glance</h2></div><span class="demo-label">LAYOUT PREVIEW</span></div>
    <div class="stats-grid">${cardNames.map((name, i) => statCard(name, cardIcons[i], ["tone-orange", "tone-violet", "tone-green"][i])).join("")}</div>
    <div class="dashboard-grid">
      <section class="content-card activity-card"><div class="card-heading"><div><h3>Recent activity</h3><p>Updates from your workspace</p></div><span class="card-heading-icon">${icon("activity")}</span></div><div class="empty-state"><span class="empty-state-icon">${icon("activity")}</span><strong>Your activity will appear here</strong><p>Once connected, this space will show the latest updates for your workspace.</p></div></section>
      <section class="content-card schedule-card"><div class="card-heading"><div><h3>Coming up</h3><p>Your schedule at a glance</p></div><span class="card-heading-icon violet-card-icon">${icon("clock")}</span></div><div class="schedule-empty"><div class="schedule-date"><strong>${new Intl.DateTimeFormat("en", { day: "2-digit" }).format(new Date())}</strong><span>${new Intl.DateTimeFormat("en", { month: "short" }).format(new Date())}</span></div><div><strong>Ready when you are</strong><p>Upcoming items will show here.</p></div></div><a class="text-link" href="${roles[role].links[1] ? `#/${role}/${roles[role].links[1][1]}` : `#/${role}/dashboard`}">Explore your workspace ${icon("arrow")}</a></section>
    </div>`;
}
