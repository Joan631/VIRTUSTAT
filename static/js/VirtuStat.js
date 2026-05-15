"use strict";

/* ============================================================
   VIRTUSTAT FRONTEND SYSTEM
   COMPLETE FLASK CONNECTED VERSION
============================================================ */

/* ============================================================
   GLOBAL API
============================================================ */
const API = {
  register: "/api/register",
  login: "/api/login",
  adminLogin: "/api/admin/login",
  adminPin: "/api/admin/pin",
  recover: "/api/recover",
  guest: "/api/guest",
  logout: "/api/logout"
};

/* ============================================================
   GLOBAL STATE
============================================================ */
let pinBuffer = "";
let toastTimeout = null;

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

  console.log("VirtuStat initialized ✔");

  initializeSystem();

});

/* ============================================================
   INITIALIZE
============================================================ */
function initializeSystem() {

  initOverlayClose();
  initNavbarEffect();
  initPasswordStrength();
  initKeyboardSupport();

  feather.replace();

}

/* ============================================================
   OVERLAY CLOSE
============================================================ */
function initOverlayClose() {

  document.querySelectorAll(".overlay").forEach(overlay => {

    overlay.addEventListener("click", (e) => {

      if (e.target === overlay) {
        overlay.classList.remove("show");
      }

    });

  });

}

/* ============================================================
   NAVBAR EFFECT
============================================================ */
function initNavbarEffect() {

  const navbar = document.getElementById("navbar");

  window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

  });

}

/* ============================================================
   KEYBOARD SUPPORT
============================================================ */
function initKeyboardSupport() {

  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

      document.querySelectorAll(".overlay.show").forEach(modal => {
        modal.classList.remove("show");
      });

    }

  });

}

/* ============================================================
   TOAST SYSTEM
============================================================ */
function showToast(type, message) {

  const toast = document.getElementById("toast");
  const dot = document.getElementById("toastDot");
  const msg = document.getElementById("toastMsg");

  if (!toast || !dot || !msg) return;

  clearTimeout(toastTimeout);

  dot.className = `toast-dot ${type}`;
  msg.textContent = message;

  toast.classList.add("show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);

}

/* ============================================================
   MODAL SYSTEM
============================================================ */
function openModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("show");
  }

}

function closeModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("show");
  }

}

function closeAllModals() {
  document.querySelectorAll(".overlay").forEach(modal => {
    modal.classList.remove("show");
  });

  resetPin(); // ADD THIS (important fix)
}

/* ============================================================
   ACCESS FLOW
============================================================ */
function openAccessModal() {

  openModal("accessModal");

}

function selectUserPath() {

  closeModal("accessModal");
  openModal("userLoginModal");

}

function selectAdminPath() {

  closeModal("accessModal");

  resetPin();

  const pinError = document.getElementById("pinError");

  if (pinError) {
    pinError.style.display = "none";
  }

  openModal("pinModal");

}

/* ============================================================
   USER LOGIN
============================================================ */
async function doUserLogin() {

  const username =
    document.getElementById("uUsername")?.value.trim();

  const password =
    document.getElementById("uPassword")?.value;

  // VALIDATION
  if (!username || !password) {

    showToast(
      "err",
      "Enter username and password"
    );

    return;
  }

  try {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        password
      })
    });

    // SERVER ERROR
    if (!res.ok) {

      const text = await res.text();

      console.error("SERVER ERROR:", text);

      showToast(
        "err",
        `Server error (${res.status})`
      );

      return;
    }

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data);

    if (data.success) {

      showToast(
        "ok",
        data.message || "Login successful"
      );

      closeModal("userLoginModal");

      setTimeout(() => {

        window.location.href = "/dashboard";

      }, 700);

    } else {

      showToast(
        "err",
        data.message || "Invalid login"
      );

    }

  } catch (error) {

    console.error(
      "LOGIN FETCH ERROR:",
      error
    );

    showToast(
      "err",
      "Cannot connect to server"
    );

  }

}

/* ============================================================
   REGISTER
============================================================ */
async function doRegister() {

  const username =
    document.getElementById("regUser")?.value.trim();

  const gmail =
    document.getElementById("regGmail")?.value.trim();

  const password =
    document.getElementById("regPw")?.value;

  const confirm =
    document.getElementById("regPwConfirm")?.value;

  if (!username || !gmail || !password || !confirm) {
    showToast("err", "Complete all fields");
    return;
  }

  if (username.length < 3) {
    showToast("err", "Username too short");
    return;
  }

  if (!gmail.includes("@")) {
    showToast("err", "Invalid email");
    return;
  }

  if (password.length < 8) {
    showToast("err", "Password must be 8+ characters");
    return;
  }

  if (password !== confirm) {
    showToast("err", "Passwords do not match");
    return;
  }

  try {

    const response = await fetch(API.register, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        gmail,
        password
      })
    });

    const data = await response.json();

    if (data.success) {

      showToast("ok", data.message);

      document.getElementById("regUser").value = "";
      document.getElementById("regGmail").value = "";
      document.getElementById("regPw").value = "";
      document.getElementById("regPwConfirm").value = "";

      closeModal("registerModal");

    } else {

      showToast("err", data.message);

    }

  } catch (error) {

    console.error(error);
    showToast("err", "Server unavailable");

  }

}

/* ============================================================
   PASSWORD RECOVERY
============================================================ */
function toggleRecovery(event) {

  event.preventDefault();

  const panel = document.getElementById("recoveryPanel");

  if (!panel) return;

  panel.classList.toggle("show");

}

async function doRecovery() {

  const username =
    document.getElementById("recUsername")?.value.trim();

  const gmail =
    document.getElementById("recGmail")?.value.trim();

  if (!username || !gmail) {
    showToast("err", "Fill all recovery fields");
    return;
  }

  try {

    const response = await fetch(API.recover, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        gmail
      })
    });

    const data = await response.json();

    if (data.success) {

      const box =
        document.getElementById("recoveredPwBox");

      const value =
        document.getElementById("recoveredPwValue");

      if (box && value) {

        box.style.display = "block";
        value.textContent = data.password;

      }

      showToast("ok", "Password recovered");

    } else {

      showToast("err", data.message);

    }

  } catch (error) {

    console.error(error);
    showToast("err", "Server unavailable");

  }

}

/* ============================================================
   ADMIN PIN SYSTEM
============================================================ */
function pinPress(number) {

  if (pinBuffer.length >= 4) return;

  pinBuffer += number;

  updatePinDots();

  if (pinBuffer.length === 4) {
    validatePin();
  }

}

function pinBack() {

  pinBuffer = pinBuffer.slice(0, -1);

  updatePinDots();

}

function pinClear() {

  resetPin();

}

function resetPin() {

  pinBuffer = "";

  updatePinDots();

}

function updatePinDots() {

  for (let i = 0; i < 4; i++) {

    const dot = document.getElementById(`pd${i}`);

    if (!dot) continue;

    dot.classList.toggle(
      "filled",
      i < pinBuffer.length
    );

  }

}

/* ============================================================
   PIN VALIDATION
============================================================ */
async function validatePin() {

  try {

    const response = await fetch(API.adminPin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        pin: pinBuffer
      })
    });

    const data = await response.json();

    if (data.success) {

      closeModal("pinModal");

      resetPin();

      openModal("adminLoginModal");

      showToast("ok", "PIN verified");

    } else {

      const pinError =
        document.getElementById("pinError");

      if (pinError) {
        pinError.style.display = "flex";
      }

      showToast("err", "Invalid administrator PIN");

      resetPin();

    }

  } catch (error) {

    console.error(error);

    showToast("err", "PIN server unavailable");

    resetPin();

  }

}

/* ============================================================
   ADMIN LOGIN
============================================================ */
async function doAdminLogin() {

  const password =
    document.getElementById("aPassword")?.value;

  if (!password) {
    showToast("err", "Enter admin password");
    return;
  }

  try {

    const response = await fetch(API.adminLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        password
      })
    });

    const data = await response.json();

    if (data.success) {

      showToast("ok", data.message);

      setTimeout(() => {
        window.location.href = "/admin";
      }, 800);

    } else {

      showToast("err", data.message);

    }

  } catch (error) {

    console.error(error);
    showToast("err", "Server unavailable");

  }

}

/* ============================================================
   GUEST MODE
============================================================ */
async function switchToGuest() {

  try {

    await fetch(API.guest, {
      method: "POST",
      credentials: "include"
    });

  } catch (error) {

    console.warn(error);

  }

  closeAllModals();

  showToast("ok", "Guest mode activated");

  setTimeout(() => {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }, 400);

}

/* ============================================================
   REGISTER SWITCH
============================================================ */
function switchToRegister() {

  closeModal("userLoginModal");

  openModal("registerModal");

}

/* ============================================================
   LOGOUT
============================================================ */
async function logout() {

  try {

    await fetch(API.logout, {
      method: "POST",
      credentials: "include"
    });

  } catch (error) {

    console.warn(error);

  }

  sessionStorage.clear();

  window.location.href = "/";

}

/* ============================================================
   PASSWORD VISIBILITY
============================================================ */
function toggleField(id) {

  const input = document.getElementById(id);

  if (!input) return;

  input.type =
    input.type === "password"
      ? "text"
      : "password";

}

/* ============================================================
   PASSWORD STRENGTH
============================================================ */
function initPasswordStrength() {

  const passwordInput =
    document.getElementById("regPw");

  if (!passwordInput) return;

  passwordInput.addEventListener("input", (e) => {
    checkStrength(e.target.value);
  });

}

function checkStrength(password) {

  const bar = document.getElementById("pwBar");
  const label = document.getElementById("pwLabel");

  if (!bar || !label) return;

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    "Enter password",
    "Weak",
    "Fair",
    "Good",
    "Strong"
  ];

  bar.style.width = `${score * 25}%`;

  label.textContent = levels[score];

}

/* ============================================================
   ESCAPE HTML
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
