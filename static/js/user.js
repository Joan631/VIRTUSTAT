"use strict";

/* ============================================================
   VIRTUSTAT USER PANEL - CLEAN VERSION
============================================================ */

/* ============================================================
   API ROUTES (MATCHING FLASK)
============================================================ */
const API = {
  session: "/api/session-check",
  system: "/api/system",
  historyGet: "/api/history",
  historyPost: "/api/history",
  historyClear: "/api/history/clear",
  me: "/api/me",

  profile: "/api/profile",
  deleteRequest: "/api/request-delete",

  logout: "/api/logout"
};

/* ============================================================
   GLOBAL STATE
============================================================ */
let networkChartInstance = null;

function initNetworkChart() {
  const ctx = document.getElementById("networkChart");
  if (!ctx) return;

  networkChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Download",
          data: [],
          borderColor: "#4ade4a",
          tension: 0.4,
          fill: false
        },
        {
          label: "Upload",
          data: [],
          borderColor: "#60a5fa",
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { display: false },
        y: { beginAtZero: true }
      }
    }
  });
}

let bandwidthChartInstance = null;

function initBandwidthChart() {
  const ctx = document.getElementById("bandwidthChart");
  if (!ctx) return;

  bandwidthChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Usage"],
      datasets: [
        {
          label: "Bandwidth %",
          data: [0],
          backgroundColor: "#4ade4a"
        }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function updateBandwidth(percent) {
  if (!bandwidthChartInstance) return;

  percent = Math.max(0, Math.min(100, percent));

  bandwidthChartInstance.data.datasets[0].data[0] = percent;
  bandwidthChartInstance.update();

  const label = document.getElementById("bwPct");
  if (label) label.textContent = `Bandwidth Usage: ${percent}%`;
}

/* ============================================================
   SAFE FETCH HELPER
============================================================ */
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...options
    });

    const data = await res.json().catch(() => ({}));
    return data;
  } catch (err) {
    console.error("FETCH ERROR:", url, err);
    return null;
  }
}

/* ============================================================
   SESSION CHECK
============================================================ */
async function verifySession() {
  const data = await safeFetch(API.session);

  if (!data || !data.logged_in) {
    window.location.href = "/";
  }
}

/* ============================================================
   GAUGE UI
============================================================ */
function setGauge(fillId, valId, pct) {
  pct = Math.max(0, Math.min(100, pct || 0));

  const C = 238.76;
  const offset = C - (pct / 100) * C;

  const fill = document.getElementById(fillId);
  const val = document.getElementById(valId);

  if (fill) fill.style.strokeDashoffset = offset;
  if (val) val.textContent = pct + "%";
}

/* ============================================================
   SYSTEM METRICS
============================================================ */
async function loadSystem() {
  const data = await safeFetch(API.system);

  if (!data || !data.success) return;

  // =========================
  // GAUGES (CPU / RAM / DISK)
  // =========================
  setGauge("gaugeCpuFill", "gaugeCpuVal", data.cpu);
  setGauge("gaugeRamFill", "gaugeRamVal", data.ram);
  setGauge("gaugeDiskFill", "gaugeDiskVal", data.disk);
  setGauge("gaugeStorFill", "gaugeStorVal", data.storage);

  // =========================
  // SAFE TEXT HELPER
  // =========================
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // =========================
  // NETWORK STATS
  // =========================
  const netDown = Number(data.netDown || 0);
  const netUp = Number(data.netUp || 0);

  setText("netDown", `${netDown} MB/s`);
  setText("netUp", `${netUp} MB/s`);

  setText(
    "netLatency",
    data.latency > 0 ? `${data.latency} ms` : "N/A"
  );

  setText("netPackets", (data.packets || 0).toLocaleString());

  // =========================
  // UPTIME
  // =========================
  if (data.uptime) {
    const { hours = 0, minutes = 0, seconds = 0 } = data.uptime;

    const pad = (n) => String(n).padStart(2, "0");
    const text = `UP ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    setText("uptimeTicker", text);
    setText("kpiUptimeTime", `Uptime: ${text}`);
  }

  // =========================
  // BANDWIDTH FIX (THIS IS WHAT WAS MISSING)
  // =========================
  const bandwidthPercent = Math.min(
    100,
    Math.round((netDown + netUp) * 10) // scaling factor (adjust if needed)
  );

  updateBandwidth(bandwidthPercent);

  // =========================
  // BANDWIDTH CHART FIX
  // =========================
  if (bandwidthChartInstance) {
    bandwidthChartInstance.data.datasets[0].data[0] = bandwidthPercent;
    bandwidthChartInstance.update();
  }

  // =========================
  // NETWORK CHART (LIVE LINE)
  // =========================
  if (networkChartInstance) {
    const now = new Date().toLocaleTimeString();

    networkChartInstance.data.labels.push(now);
    networkChartInstance.data.datasets[0].data.push(netDown);
    networkChartInstance.data.datasets[1].data.push(netUp);

    if (networkChartInstance.data.labels.length > 30) {
      networkChartInstance.data.labels.shift();
      networkChartInstance.data.datasets[0].data.shift();
      networkChartInstance.data.datasets[1].data.shift();
    }

    networkChartInstance.update();
  }

  // =========================
  // HEALTH TABLE
  // =========================
  renderHealthTable(data);
}

/* ============================================================
   HISTORY
============================================================ */
async function renderHistory() {
  const data = await safeFetch(API.historyGet);

  const box = document.getElementById("historyList");
  if (!box) return;

  if (!Array.isArray(data) || data.length === 0) {
    box.innerHTML = `<div style="color:var(--muted)">No history</div>`;
    return;
  }

  box.innerHTML = data
    .slice(-10)
    .reverse()
    .map(h => `
      <div class="hist-entry">
        <div class="hist-entry-label">${escapeHtml(h.label)}</div>
        <div class="hist-entry-meta">${escapeHtml(h.meta)}</div>
      </div>
    `)
    .join("");
}

/* ============================================================
   ADD HISTORY
============================================================ */
async function addHistory(action, details) {
  await safeFetch(API.historyPost, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, details })
  });

  renderHistory();
}

async function loadOverview() {
  try {
    const res = await fetch("/api/dashboard/overview");

    if (!res.ok) return; // handles 403/500/etc

    const data = await res.json();

    if (!data.success) return;

    document.getElementById("kpiUsers").textContent =
      Number(data.users || 0).toLocaleString();

    document.getElementById("kpiLogins").textContent =
      Number(data.login_attempts || 0).toLocaleString();

    document.getElementById("kpiErrors").textContent =
      Number(data.errors || 0).toLocaleString();

    document.getElementById("kpiUptime").textContent =
      formatUptime(data.uptime || 0);

  } catch (err) {
    console.error("Overview load failed:", err);
  }
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${d}d ${h}h ${m}m ${s}s`;
}

/* ============================================================
   PROFILE LOAD
============================================================ */
async function loadProfile() {
  const res = await fetch(API.me, { credentials: "include" });
  const user = await res.json();

  const name = document.getElementById("epName");
  const email = document.getElementById("epEmail");

  if (name) name.value = user.username || "";
  if (email) email.value = user.gmail || "";
}

/* ============================================================
   PROFILE UPDATE
============================================================ */
async function updateProfile() {
  const username = document.getElementById("epName")?.value.trim();
  const gmail = document.getElementById("epEmail")?.value.trim();
  const password = document.getElementById("epPw")?.value.trim();

  if (!username && !gmail && !password) {
    showToast("err", "Enter at least one field");
    return;
  }

  const payload = {
    username: username || null,
    gmail: gmail || null,
    password: password || null
  };

  const data = await safeFetch(API.profile, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (data && data.success) {
    showToast("ok", "Profile updated");
    addHistory("Profile Update", "Updated account info");
  } else {
    showToast("err", data?.message || "Update failed");
  }
}

/* ============================================================
   LOGOUT
============================================================ */
async function logout() {
  await safeFetch(API.logout, { method: "POST" });

  showToast("ok", "Logging out...");

  setTimeout(() => {
    window.location.href = "/";
  }, 800);
}


function renderHealthTable(data) {
  const body = document.getElementById("healthBody");
  if (!body || !data.services) return;

  body.innerHTML = data.services.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.status}</td>
      <td>${s.cpu}%</td>
      <td>${s.memory}%</td>
      <td>${s.response}ms</td>
      <td>${s.uptime}</td>
      <td>${s.last_check}</td>
    </tr>
  `).join("");
}

/* ============================================================
   TOAST SYSTEM
============================================================ */
function showToast(type, message) {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-body">
      <div class="toast-title">VirtuStat</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("out"), 3000);
  setTimeout(() => toast.remove(), 3500);
}

/* ============================================================
   HTML ESCAPE
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

/* ============================================================
   BUTTON BINDINGS (FIXES "NOT CLICKABLE")
============================================================ */
function bindButtons() {
  document.getElementById("btnUpdateProfile")
    ?.addEventListener("click", updateProfile);

  document.getElementById("btnDeleteAccount")
    ?.addEventListener("click", requestDeleteAccount);

  document.getElementById("btnLogout")
    ?.addEventListener("click", logout);
}


/* ============================================================
   REPLACE clearHistory()
============================================================ */

async function clearHistory() {

  const ok =
    confirm("Clear all history?");

  if (!ok) return;

  const data = await safeFetch(
    API.historyClear,
    {
      method: "DELETE"
    }
  );

  if (data && data.success) {

    showToast("ok", "History cleared");

    renderHistory();

  } else {

    showToast(
      "err",
      data?.message || "Failed to clear history"
    );
  }
}

async function requestDeleteAccount() {
  const confirmDelete = confirm("Send delete request to admin?");
  if (!confirmDelete) return;

  const data = await safeFetch(API.deleteRequest, {
    method: "POST"
  });

  if (data && data.success) {
    showToast("ok", "Delete request sent");
    addHistory("Delete Request", "Requested account deletion");
  } else {
    showToast("err", data?.message || "Failed to send request");
  }
}

/* ============================================================
   AUTO REFRESH LOOP
============================================================ */
function startLoops() {
  loadSystem();
  renderHistory();

  setInterval(loadSystem, 2000);
  setInterval(renderHistory, 10000);
}


/* ============================================================
   LOGOUT
============================================================ */
async function logoutAdmin() {
  await safeFetch(API.logout, { method: "POST" });
  window.location.href = "/";
}

/* ============================================================
   MISSING UI FUNCTIONS (FIX CLICK ISSUE)
============================================================ */

function toggleDD(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // close other dropdowns
  document.querySelectorAll(".dd-wrap").forEach(d => {
    if (d.id !== id) d.classList.remove("open");
  });

  el.classList.toggle("open");
}

function scrollSection(sel) {

  const el = document.querySelector(sel);

  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function openEditProfile() {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

function openConfirm(action) {
  const modal = document.getElementById("confirmModal");
  if (!modal) return;

  modal.style.display = "flex";
  window.pendingAction = action;
}

async function doConfirmAction() {

  if (!window.pendingAction) return;

  if (window.pendingAction === "delete") {

    await requestDeleteAccount();

  } else if (
    window.pendingAction === "logoutAdmin"
  ) {

    await logout();
  }

  closeModal("confirmModal");

  window.pendingAction = null;
}

async function refreshHealth() {
  showToast("ok", "Refreshing system health...");

  const data = await safeFetch(API.system);

  if (!data || !data.success) {
    showToast("err", "Failed to refresh system health");
    return;
  }

  // Update gauges immediately
  setGauge("gaugeCpuFill", "gaugeCpuVal", data.cpu);
  setGauge("gaugeRamFill", "gaugeRamVal", data.ram);
  setGauge("gaugeDiskFill", "gaugeDiskVal", data.disk);
  setGauge("gaugeStorFill", "gaugeStorVal", data.storage);

  // Update text values
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("netDown", (data.netDown || 0) + " MB/s");
  setText("netUp", (data.netUp || 0) + " MB/s");
  setText("netLatency", data.latency > 0 ? `${data.latency} ms` : "N/A");
  setText("netPackets", (data.packets || 0).toLocaleString());

  renderHealthTable(data);

  showToast("ok", "System updated");
}

function saveProfile() {
  updateProfile();
  closeModal("editProfileModal");
}

async function exportReport() {
  showToast("ok", "Generating report...");

  const data = await safeFetch(API.system);

  if (!data || !data.success) {
    showToast("err", "Failed to generate report");
    return;
  }

  const report = {
    timestamp: new Date().toISOString(),
    cpu: data.cpu,
    ram: data.ram,
    disk: data.disk,
    storage: data.storage,
    network: {
      download: data.netDown,
      upload: data.netUp,
      latency: data.latency,
      packets: data.packets
    },
    uptime: data.uptime,
    services: data.services
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `virtustat-report-${Date.now()}.json`;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("ok", "Report downloaded");
}

window.addEventListener("DOMContentLoaded", async () => {

  await verifySession();
  await loadProfile();
  await renderHistory();

  initNetworkChart();
  initBandwidthChart();

  bindButtons(); 
  loadOverview();

  startLoops();
});
