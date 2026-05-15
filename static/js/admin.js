"use strict";

/* ============================================================
   API
============================================================ */
const API = {
  session: "/api/session-check",
  users: "/api/admin/users",
  deleteRequests: "/api/admin/delete-requests",
  approveDelete: "/api/admin/approve-delete",
  rejectDelete: "/api/admin/reject-delete",
  userLogs: (username) =>
    `/api/admin/user-logs/${encodeURIComponent(username)}`,
  logout: "/api/logout"
};

/* ============================================================
   STATE
============================================================ */
let currentSection = "users";
let cachedUsers = [];
let cachedDeletes = [];

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("VirtuStat Admin Loaded ✔");

  try {
    await verifySession();

    initIcons();
    initClock();
    initSearchBar();

    await showSection("users");

  } catch (err) {
    console.error(err);
    alert("Unauthorized access");
    window.location.href = "/";
  }
});

/* ============================================================
   API WRAPPER
============================================================ */
async function api(url, options = {}) {

  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

/* ============================================================
   SESSION
============================================================ */
async function verifySession() {
  const res = await api(API.session);

  const role = res.role || res.data?.role;

  if (role !== "admin") {
    throw new Error("Not admin");
  }
}

/* ============================================================
   ICONS
============================================================ */
function initIcons() {
  if (window.feather) feather.replace();
}

/* ============================================================
   CLOCK
============================================================ */
function initClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;

  setInterval(() => {
    const now = new Date();
    clock.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString()}`;
  }, 1000);
}

/* ============================================================
   NAVIGATION
============================================================ */
async function showSection(section) {

  currentSection = section;

  const sections = ["users", "deletes", "logs", "firewall", "config"];

  sections.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.style.display = id === section ? "block" : "none";
  });

  document.querySelectorAll(".nav-item")
    .forEach(el => el.classList.remove("active"));

  const activeBtn = document.getElementById(`btn-${section}`);
  if (activeBtn) activeBtn.classList.add("active");

  const title = document.getElementById("view-title");
  if (title) title.textContent = section.toUpperCase();

  if (section === "users") await loadUsers();
  if (section === "deletes") await loadDeleteRequests();
}

/* ============================================================
   USERS
============================================================ */
async function loadUsers() {
  try {
    const res = await api(API.users);
    cachedUsers = res.users || [];
    renderUsers(cachedUsers);
    updateCounts();
  } catch (err) {
    console.error(err);
  }
}

function renderUsers(users) {

  const tbody = document.getElementById("usersBody");
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4">No users found</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.gmail)}</td>
      <td>${escapeHtml(user.role)}</td>
      <td>
        <button class="action-btn view-btn" data-user="${user.username}">
          View
        </button>
      </td>
    </tr>
  `).join("");

  // SAFE EVENT BINDING (FIX FOR BROKEN BUTTONS)
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.onclick = () => viewUser(btn.dataset.user);
  });
}

/* ============================================================
   SEARCH
============================================================ */
function initSearchBar() {

  const input = document.getElementById("userSearch");
  if (!input) return;

  input.addEventListener("input", () => {

    const q = input.value.toLowerCase();

    if (!q) return renderUsers(cachedUsers);

    const filtered = cachedUsers.filter(u =>
      (u.username || "").toLowerCase().includes(q) ||
      (u.gmail || "").toLowerCase().includes(q)
    );

    renderUsers(filtered);
  });
}

/* ============================================================
   DELETE REQUESTS
============================================================ */
async function loadDeleteRequests() {
  try {
    const res = await api(API.deleteRequests);
    cachedDeletes = res.requests || [];
    renderDeleteRequests(cachedDeletes);
    updateCounts();
  } catch (err) {
    console.error(err);
  }
}

function renderDeleteRequests(reqs) {

  const tbody = document.getElementById("deleteBody");
  if (!tbody) return;

  if (!reqs.length) {
    tbody.innerHTML = `<tr><td colspan="4">No delete requests</td></tr>`;
    return;
  }

  tbody.innerHTML = reqs.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.username)}</td>
      <td>${escapeHtml(r.date)}</td>
      <td>
        <button onclick="approveDelete(${r.id})">Approve</button>
        <button onclick="rejectDelete(${r.id})">Reject</button>
      </td>
    </tr>
  `).join("");
}

/* ============================================================
   ACTIONS
============================================================ */
async function approveDelete(id) {
  await api(API.approveDelete, {
    method: "POST",
    body: JSON.stringify({ user_id: id })
  });

  await loadDeleteRequests();
  await loadUsers();
}

async function rejectDelete(id) {
  await api(API.rejectDelete, {
    method: "POST",
    body: JSON.stringify({ user_id: id })
  });

  await loadDeleteRequests();
}

/* ============================================================
   USER LOGS MODAL
============================================================ */
async function viewUser(username) {

  const res = await api(API.userLogs(username));
  const logs = res.logs || [];

  const modal = document.getElementById("logsModal");
  const tbody = document.getElementById("logsBody");
  const title = document.getElementById("logsTitle");

  if (!modal || !tbody || !title) return;

  title.textContent = `${username} Activity Logs`;

  tbody.innerHTML = logs.length
    ? logs.map(l => `
      <tr>
        <td>${escapeHtml(l.action)}</td>
        <td>${escapeHtml(l.details)}</td>
        <td>${escapeHtml(l.time)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3">No logs</td></tr>`;

  modal.style.display = "block";
}

function closeLogsModal() {
  const modal = document.getElementById("logsModal");
  if (modal) modal.style.display = "none";
}

/* ============================================================
   COUNTS
============================================================ */
function updateCounts() {
  const u = document.getElementById("count-users");
  const d = document.getElementById("count-req-priority");

  if (u) u.textContent = cachedUsers.length;
  if (d) d.textContent = cachedDeletes.length;
}

/* ============================================================
   LOGOUT
============================================================ */
async function logoutAdmin() {
  await api(API.logout, { method: "POST" });
  window.location.href = "/";
}

/* ============================================================
   ESCAPE
============================================================ */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
