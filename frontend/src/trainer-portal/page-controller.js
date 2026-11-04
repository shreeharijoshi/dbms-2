import { escapeHtml } from "../members/html.js";
import { getTrainerMember, getTrainerMembers, getTrainerOverview, getTrainerPortalProfile } from "./api.js";
import { trainerDashboardContent, trainerMemberProfile, trainerMemberTable, trainerProfileContent } from "../pages/trainer-portal.js";

let page = 0;
let total = 0;
let timer;
let requestVersion = 0;
let selectedTrainerId = "";

async function refreshMembers() {
  const root = document.querySelector("#trainer-members-page");
  if (!root) return;
  const version = ++requestVersion;
  const results = root.querySelector("#trainer-member-results");
  const count = root.querySelector("#trainer-member-count");
  results.innerHTML = '<div class="member-loading"><span class="member-spinner"></span>Loading members…</div>';
  try {
    const response = await getTrainerMembers(selectedTrainerId, { search: root.querySelector("#trainer-member-search").value.trim(), skip: page * 100, limit: 100 });
    if (version !== requestVersion || !root.isConnected) return;
    total = response.total;
    count.textContent = `${total} assigned ${total === 1 ? "member" : "members"}`;
    const pages = Math.max(1, Math.ceil(total / 100));
    results.innerHTML = `${trainerMemberTable(response.items)}${total > 100 ? `<nav class="member-pagination"><button class="member-button member-button-muted" data-action="trainer-members-prev" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pages}</span><button class="member-button member-button-muted" data-action="trainer-members-next" ${page + 1 >= pages ? "disabled" : ""}>Next</button></nav>` : ""}`;
  } catch (error) {
    if (version !== requestVersion || !root.isConnected) return;
    count.textContent = "Members unavailable";
    results.innerHTML = `<div class="member-state member-error"><strong>Unable to load your members</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-trainer-members">Try again</button></div>`;
  }
}

export async function mountTrainerPortalPage({ page: currentPage, trainerMemberId, trainerId = selectedTrainerId } = {}) {
  selectedTrainerId = trainerId;
  if (!selectedTrainerId) {
    const root = document.querySelector("#trainer-dashboard-page, #trainer-profile-page, #trainer-members-page, #trainer-member-profile");
    if (root) root.innerHTML = '<div class="member-state"><strong>Choose a trainer record</strong><p>Select a trainer from the workspace menu above to view this dashboard.</p></div>';
    return;
  }
  if (currentPage === "dashboard") {
    const root = document.querySelector("#trainer-dashboard-page");
    if (!root) return;
    const version = ++requestVersion;
    try {
      const data = await getTrainerOverview(selectedTrainerId);
      if (version === requestVersion && root.isConnected) root.outerHTML = trainerDashboardContent(data);
    } catch (error) {
      if (version === requestVersion && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your trainer dashboard</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-trainer-dashboard">Try again</button></div>`;
    }
    return;
  }
  if (currentPage === "my-profile") {
    const root = document.querySelector("#trainer-profile-page");
    if (!root) return;
    const version = ++requestVersion;
    try {
      const profile = await getTrainerPortalProfile(selectedTrainerId);
      if (version === requestVersion && root.isConnected) root.outerHTML = trainerProfileContent(profile);
    } catch (error) {
      if (version === requestVersion && root.isConnected) root.innerHTML = `<div class="member-state member-error"><strong>Unable to load your profile</strong><p>${escapeHtml(error.message)}</p><button class="member-button member-button-muted" data-action="retry-trainer-profile">Try again</button></div>`;
    }
    return;
  }
  if (currentPage === "my-members" && trainerMemberId) {
    const root = document.querySelector("#trainer-member-profile");
    if (!root) return;
    const version = ++requestVersion;
    try {
      const member = await getTrainerMember(selectedTrainerId, trainerMemberId);
      if (version === requestVersion && root.isConnected) root.outerHTML = trainerMemberProfile(member);
    } catch (error) {
      if (version === requestVersion && root.isConnected) root.innerHTML = `<a class="member-back-link" href="#/trainer/my-members">←&nbsp; Back to my members</a><div class="member-state member-error"><strong>Unable to load this assigned member</strong><p>${escapeHtml(error.message)}</p></div>`;
    }
    return;
  }
  if (currentPage === "my-members") { page = 0; await refreshMembers(); }
}

export function handleTrainerPortalInput(event) {
  if (!event.target.matches("#trainer-member-search")) return;
  page = 0; clearTimeout(timer); timer = setTimeout(refreshMembers, 250);
}

export function handleTrainerPortalClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "retry-trainer-dashboard") mountTrainerPortalPage({ page: "dashboard" });
  if (action === "retry-trainer-profile") mountTrainerPortalPage({ page: "my-profile" });
  if (action === "retry-trainer-members") refreshMembers();
  if (action === "trainer-members-prev" && page > 0) { page -= 1; refreshMembers(); }
  if (action === "trainer-members-next" && (page + 1) * 100 < total) { page += 1; refreshMembers(); }
}
