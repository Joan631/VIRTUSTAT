================================================================================
  VIRTUSTAT — Monitor. Analyze. Optimize.
  README & Project Documentation
================================================================================

  Version   : 1.0 (Final Release)
  Type      : Static Web Application (Client-Side Only)
  Stack     : HTML5 · CSS3 · Vanilla JavaScript
  Theme     : Dark UI — Forest Green (#4ADE4A) on Deep Charcoal (#0A0C0A)

================================================================================
  TABLE OF CONTENTS
================================================================================

  1.  Project Overview
  2.  File Structure
  3.  How to Run the Project
  4.  System Architecture & Page Flow
  5.  Page 1 — Login & Landing Interface
  6.  Page 2 — User Dashboard
  7.  Page 3 — Admin OS Dashboard
  8.  Role-Based Access System
  9.  Authentication & Security Features
  10. Data Persistence (localStorage)
  11. UI Components & Design System
  12. Third-Party Libraries Used
  13. Known Limitations
  14. Future Improvements
  15. Credits & Authorship

================================================================================
  1. PROJECT OVERVIEW
================================================================================

VirtuStat is a fully client-side, browser-based system monitoring and
administration platform. It simulates a real-world infrastructure dashboard
with role-based access control, live performance metrics, service health
monitoring, and a full administrative control panel.

The project is built entirely using plain HTML, CSS, and JavaScript — no
back-end server, no frameworks, and no build tools are required. All data
is stored and managed through the browser's localStorage API, making it
completely portable and runnable by simply opening the HTML files in any
modern web browser.

VirtuStat is designed with a dark, terminal-inspired aesthetic and targets
a "Mission Control" visual experience — blending professional UI design with
system monitoring functionality.

================================================================================
  2. FILE STRUCTURE
================================================================================

  VirtuStat/
  │
  ├── Virtusat-final-login-interface.html   ← Landing page & login portal
  ├── virtustat-dashboard.html              ← User/operator monitoring dashboard
  └── admin-dashboard.html                 ← Admin OS control panel
  └── README.txt                           ← This file

  All three HTML files are self-contained. Each file includes its own
  embedded CSS (inside <style> tags) and JavaScript (inside <script> tags).
  No external files, images, or folders are required.

================================================================================
  3. HOW TO RUN THE PROJECT
================================================================================

  OPTION A — Direct Browser Open (Recommended)
  ─────────────────────────────────────────────
  1. Download or unzip all three HTML files into the same folder.
  2. Open "Virtusat-final-login-interface.html" in any modern web browser
     (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).
  3. The landing page will load. From there, use the sign-in card to log in
     and navigate to the appropriate dashboard.

  OPTION B — Local Development Server (Optional)
  ────────────────────────────────────────────────
  If you prefer running a local server (e.g., with VS Code Live Server or
  Python's built-in HTTP server), you can do so as follows:

  Using Python:
    python -m http.server 8000
  Then open: http://localhost:8000/Virtusat-final-login-interface.html

  Using VS Code:
    Install the "Live Server" extension, right-click the login HTML file,
    and select "Open with Live Server."

  REQUIREMENTS:
  - Any modern web browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
  - JavaScript must be enabled
  - Internet connection is only needed to load Google Fonts and icon libraries
    (Feather Icons, Chart.js via CDN). The UI still works offline, but fonts
    and charts may be affected.

================================================================================
  4. SYSTEM ARCHITECTURE & PAGE FLOW
================================================================================

  The system follows a three-page flow:

  ┌─────────────────────────────┐
  │   LOGIN & LANDING PAGE      │  ← Entry point for all users
  │  (login-interface.html)     │
  └────────────┬────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
  ┌──────────┐    ┌──────────────┐
  │   USER   │    │   ADMIN OS   │
  │ DASHBOARD│    │  DASHBOARD   │
  │(dash.html)│   │(admin-db.html│
  └──────────┘    └──────────────┘

  - All users first arrive at the Login & Landing page.
  - When the "Sign In" action is triggered, a role-selector modal appears
    prompting the user to choose: Admin, User, or Guest.
  - Admin users are directed to the Admin OS Dashboard after a secondary
    PIN authentication step.
  - Standard Users and Guests are directed to the User Dashboard.
  - Admins can also access the User Dashboard directly from the admin panel.
  - Sessions end by clicking "Terminate Session," which redirects back to
    the login page.

================================================================================
  5. PAGE 1 — LOGIN & LANDING INTERFACE
================================================================================

  File: Virtusat-final-login-interface.html

  This is the main entry point and public-facing page of VirtuStat. It serves
  two purposes: a marketing/landing page and the authentication portal.

  SECTIONS ON THIS PAGE:
  ────────────────────────
  a) Navigation Bar
     - Fixed top bar with logo, nav links (Home, About, Sign In), and a CTA.
     - Scrolls transparently and darkens on scroll.

  b) Hero Section
     - Full-screen hero with animated badge ("LIVE MONITORING ACTIVE"),
       headline, subheading, and two CTA buttons: "Launch Dashboard" and
       "View System Status."
     - Background grid pattern and radial green glow for atmosphere.

  c) About / Capabilities Section
     - Grid of capability cards explaining VirtuStat's features:
       Real-Time Monitoring, Threat Detection, Performance Analytics,
       Resource Management, and more.
     - Includes a Mission Statement box.

  d) Sign-In Section
     - Left panel: explains role types (Admin, User, Guest) with colored badges.
     - Right panel: the Login Card — the main authentication widget.

  LOGIN CARD FEATURES:
  ─────────────────────
  - Username and Password fields with show/hide password toggle.
  - Password Strength Meter (visual bar that rates strength from Weak to Strong).
  - Attempt Tracking Bar: tracks failed login attempts with a warning bar.
    After 3 failed attempts, the account is temporarily frozen (lockout).
  - Status Messages: color-coded inline alerts for errors, warnings, success,
    and account freeze states, with shake animation on errors.
  - "Sign In" button with a loading spinner animation while processing.
  - "Register" button that opens a registration modal for new users.
  - "Forgot Password?" link that opens the Account Recovery panel.
  - Account Recovery Panel: reveals stored credentials from localStorage and
    provides options to reset the account.
  - Demo Credentials note for easy testing.

  ROLE SELECTOR MODAL:
  ─────────────────────
  - After a valid login, a modal asks the user to select their access level:
    USER (standard monitoring access) or ADMIN (full control access).
  - Selecting Admin triggers the Admin PIN Modal.

  ADMIN PIN MODAL:
  ─────────────────
  - Styled with amber (gold) accents to distinguish it from standard flow.
  - Visual PIN dot indicators (4 dots) show entry progress.
  - Numeric keypad with a backspace key and a Clear (danger) key.
  - On correct PIN entry: redirects to admin-dashboard.html.
  - On wrong PIN: shakes and resets dots.

  MODALS AVAILABLE ON THIS PAGE:
  ────────────────────────────────
  - Role Selector Modal     — choose access level
  - Admin PIN Modal         — 4-digit PIN for admin authentication
  - Registration Modal      — create a new account
  - Recovery Modal          — recover forgotten credentials
  - Emergency Override Link — escalation access in lockout scenarios

  FOOTER:
  - Displays VirtuStat logo, copyright, system version tag, and build info.

================================================================================
  6. PAGE 2 — USER DASHBOARD
================================================================================

  File: virtustat-dashboard.html

  The User Dashboard is the main monitoring interface for logged-in users.
  It provides real-time (simulated) system metrics, service health data,
  network activity charts, and guest session management.

  LAYOUT:
  ────────
  - Fixed top header bar with logo, uptime ticker, notification bell,
    settings dropdown, and user profile dropdown.
  - Collapsible left sidebar with navigation links to each section.
  - Scrollable main content area divided into distinct sections.

  SIDEBAR NAVIGATION SECTIONS:
  ──────────────────────────────
  Main:
    - Overview    — System status summary and metric cards
    - Resources   — Gauges and network chart

  Admin:
    - Admin Panel — Admin-only tools
    - Health      — Service health table

  Monitoring:
    - Guests      — Guest session activity log

  DASHBOARD SECTIONS IN DETAIL:

  a) System Overview
     - Metric cards showing: Active Nodes, Active Alerts, Uptime %, and
       Current CPU Load.
     - Live uptime ticker in the header (counts up in real-time: HH:MM:SS).
     - Page sub-header showing current local time, updated every second.
     - "Run Diagnostics" button that triggers a simulated system scan toast.

  b) Resources
     - CPU Gauge: animated circular gauge showing live CPU usage percentage.
     - RAM Usage progress bar with percentage.
     - Disk I/O progress bar with percentage.
     - Storage Allocation progress bar with percentage.
     - All four values drift automatically using a randomized simulation
       algorithm that mimics real system behavior.
     - Network Activity Chart (Chart.js line chart):
       - Live scrolling line chart showing inbound and outbound network
         traffic over time.
       - Updates every 1.5 seconds with new data points.
       - Styled in VirtuStat green with a glowing gradient fill.

  c) Service Health Table
     - Lists 10 core monitored services:
         Web Server (Nginx), Database (PostgreSQL), Auth Service (JWT),
         Cache Layer (Redis), Message Queue (RabbitMQ),
         Storage Service (MinIO), Monitoring (Prometheus),
         Firewall (pfSense), API Gateway, Backup Daemon.
     - For each service: displays CPU%, Memory%, Response Time (ms),
       Uptime %, and a color-coded status badge (OK / WARN / ERROR).
     - Auto-refreshes every 2 seconds with simulated metric drift.
     - Status logic:
         ERROR  → CPU > 80% OR Memory > 85% OR Response > 200ms
         WARN   → CPU > 60% OR Memory > 70% OR Response > 80ms
         OK     → Everything within normal thresholds

  d) Guest Activity Log
     - Displays a log table of guest user sessions and actions.
     - Columns: timestamp, username, action type, and status.
     - "Clear Logs" button wipes the log and fires a confirmation toast.
     - Populated from localStorage (virtustatGuests key).
     - Shows an empty-state placeholder when no guest activity exists.

  e) Admin Panel Section
     - Accessible from the sidebar (Admin group).
     - Contains elevated admin tools and shortcuts.

  HEADER DROPDOWN MENUS:
  ───────────────────────
  - Notifications Bell: opens a dropdown listing recent system alerts
    (CPU spike, firewall block, backup failure, etc.).
  - Settings Gear: links to Theme, Notifications, Security, and API settings.
  - User Profile Avatar: shows logged-in username and options for Profile,
    Preferences, and Logout (redirects back to login page).

================================================================================
  7. PAGE 3 — ADMIN OS DASHBOARD
================================================================================

  File: admin-dashboard.html

  The Admin OS Dashboard is the back-end control interface exclusively for
  administrators. It provides user management, access request handling,
  system logs, firewall monitoring, and system configuration.

  LAYOUT:
  ────────
  - Fixed left sidebar (260px wide) with logo and navigation groups.
  - Full-height scrollable main content area on the right.

  SIDEBAR SECTIONS:
  ──────────────────
  Core Management:
    - User Database     — View, search, and manage registered users
    - Access Requests   — Review and act on pending user requests
    - System Logs       — View authenticated session log output

  Security Controls:
    - Firewall          — Firewall shield status panel
    - System Config     — Core kernel configuration status

  Bottom:
    - Terminate Session — Logs out and redirects to login page

  STATS OVERVIEW BAR:
  ────────────────────
  Three quick-stat cards at the top of the main view:
    - Total Users     — Count of registered users in localStorage
    - Access Requests — Count of pending requests in localStorage
    - One additional system-level stat card

  CORE MANAGEMENT PANELS:

  a) User Database (section-users)
     - Displays a searchable table of all registered users pulled from
       localStorage (virtustatUsers key).
     - Columns: Username, Email (gmail), and Actions.
     - Search bar: filters users in real-time by username.
     - "Terminate" button next to each user: deletes the user from the
       database immediately (with confirmation prompt via browser dialog).
     - On first load, if localStorage is empty, a set of 15 dummy users
       (User_Node_01 through User_Node_15) with virtustat.io email addresses
       is automatically seeded as demo data.

  b) Access Requests (section-requests)
     - Lists all pending administrative requests from users.
     - Columns: Request ID, Username, Request Type, Target, Time, and Actions.
     - Two action buttons per request:
         Execute — approves and processes the request (removes from queue).
         Ignore  — dismisses the request without action.
     - Request types seeded as demo data include: Account Deletion and
       Data Deletion targeting registries, logs, caches, and archives.

  c) System Logs (section-logs)
     - Displays a terminal-style log panel.
     - Shows authenticated session confirmation:
       "[OK] Admin Session Authenticated."

  SECURITY CONTROLS PANELS:

  d) Firewall (section-firewall)
     - Displays firewall enforcement status: "SHIELD ENFORCED"
     - Styled in green to indicate active protection.

  e) System Config (section-config)
     - Displays kernel stability status: "CORE KERNEL STABLE"
     - Styled in muted tones, indicating a stable, unchanged configuration.

================================================================================
  8. ROLE-BASED ACCESS SYSTEM
================================================================================

  VirtuStat implements three distinct user roles:

  ┌──────────┬──────────────────────────────────────────────────────────────┐
  │ ROLE     │ ACCESS LEVEL & CAPABILITIES                                  │
  ├──────────┼──────────────────────────────────────────────────────────────┤
  │ ADMIN    │ Full access. Can view and manage all users, handle access     │
  │ (amber)  │ requests, view system logs, firewall, and config. Requires    │
  │          │ secondary PIN authentication after password login.             │
  │          │ Redirected to: admin-dashboard.html                           │
  ├──────────┼──────────────────────────────────────────────────────────────┤
  │ USER     │ Standard monitoring access. Can view all dashboard sections   │
  │ (muted)  │ including real-time metrics, service health, and guest logs.  │
  │          │ Redirected to: virtustat-dashboard.html                       │
  ├──────────┼──────────────────────────────────────────────────────────────┤
  │ GUEST    │ Limited read-only monitoring access. Activity is logged and   │
  │ (amber)  │ visible to admins in the Guest Activity Log section.          │
  │          │ Redirected to: virtustat-dashboard.html                       │
  └──────────┴──────────────────────────────────────────────────────────────┘

================================================================================
  9. AUTHENTICATION & SECURITY FEATURES
================================================================================

  a) Login Form Validation
     - Username and password are required fields.
     - Credentials are validated against localStorage records.
     - Incorrect credentials trigger an animated error status message.

  b) Attempt Limiter (Brute-Force Protection)
     - Failed login attempts are tracked per session.
     - After 3 failed attempts: a visual warning bar appears showing
       remaining attempts and the account enters a "Frozen" state.
     - Frozen accounts display a frozen status message and temporarily
       disable the login button with a cooldown period.

  c) Password Strength Meter
     - Real-time visual bar rates password strength on input:
         Weak (red) → Fair (orange) → Good (yellow) → Strong (green)
     - Scoring based on length, uppercase, lowercase, numbers, and symbols.

  d) Show/Hide Password Toggle
     - Eye icon button toggles password field between masked and plaintext.

  e) Admin PIN Authentication
     - Secondary layer of security for admin access.
     - 4-digit PIN entered via on-screen keypad (not keyboard-typed, for
       visual clarity).
     - PIN dots animate as each digit is entered.
     - Wrong PIN resets the input and shows an error animation.

  f) Account Recovery
     - "Forgot Password?" reveals a recovery panel within the login card.
     - Pulls the stored password from localStorage and displays it in a
       green-highlighted reveal box.
     - Offers options to reset the account or confirm the known password.

  g) Session Termination
     - "Terminate Session" in the admin sidebar clears the session and
       redirects back to the login page.
     - User profile dropdown "Logout" does the same from the dashboard.

  h) Emergency Override
     - A low-visibility emergency link at the bottom of the PIN modal
       allows escalated access in locked-out scenarios.

================================================================================
  10. DATA PERSISTENCE (localStorage)
================================================================================

  VirtuStat uses the browser's built-in localStorage API to store and
  retrieve all application data. No server-side database is used.

  STORAGE KEYS USED:
  ───────────────────
  Key                   │ Contents
  ──────────────────────┼──────────────────────────────────────────────────────
  virtustatUsers        │ Object: { username: { gmail, password, ... } }
                        │ Stores all registered user accounts.
  ──────────────────────┼──────────────────────────────────────────────────────
  virtustatRequests     │ Array of pending admin requests:
                        │ [{ id, user, type, target, time }, ...]
  ──────────────────────┼──────────────────────────────────────────────────────
  virtustatGuests       │ Array of guest activity log entries.
  ──────────────────────┼──────────────────────────────────────────────────────
  (session state)       │ Current logged-in user info (role, username) stored
                        │ temporarily for dashboard access.

  IMPORTANT NOTES:
  - Data is browser-specific and persists until manually cleared or until
    the browser's localStorage is reset (e.g., clearing site data).
  - Because this is localStorage and not a real database, data is not shared
    between different browsers or devices.
  - On a fresh start (empty localStorage), the admin dashboard auto-seeds
    15 demo users and 10 demo access requests for testing purposes.
  - Clearing browser data / site storage will reset the application to its
    default empty state.

================================================================================
  11. UI COMPONENTS & DESIGN SYSTEM
================================================================================

  COLOR PALETTE:
  ───────────────
  --bg          #0A0C0A   Deep charcoal background (primary)
  --bg2         #0F110F   Slightly lighter surface
  --bg3         #141714   Card backgrounds
  --bg4         #191C19   Elevated surfaces
  --green       #4ADE4A   Primary brand accent (VirtuStat green)
  --green2      #22C55E   Hover / secondary green
  --green-dark  #15803D   Muted green, borders
  --text        #EEF2EE   Primary text
  --muted       #6B7C6B   Secondary / label text
  --error       #F87171   Error states (red)
  --warn        #FBBF24   Warning states (yellow)
  --amber       #F59E0B   Admin-specific highlights

  TYPOGRAPHY:
  ────────────
  - Inter       (300–800 weight) — Body text, labels, buttons, data values
  - Rajdhani    (500–700 weight) — Headings, logo, section titles, stat numbers

  RECURRING UI COMPONENTS:
  ──────────────────────────
  - Status Badges    : OK (green), WARN (yellow), ERROR (red) — used in
                       service health table and throughout the system.
  - Toast Notifications: Fixed bottom-right pop-up messages for system events.
                       Variants: ok, error, info, warn — each with a color dot.
  - Modals           : Centered overlays with blurred backdrop, green accent
                       top border, icon, title, subtitle, and action buttons.
  - Cards            : Rounded dark surface cards with subtle green border
                       and hover glow effects.
  - Progress Bars    : Used for RAM, Disk, and Storage gauges with color
                       transitions based on usage thresholds.
  - Circular Gauge   : SVG-based animated ring for CPU percentage display.
  - Grid Background  : CSS-only dot/line grid pattern overlay (decorative).
  - Green Glow       : Box shadows and radial gradients using rgba(74,222,74)
                       to create the signature "terminal glow" feel.
  - Sidebar          : Collapsible icon-only sidebar on narrow screens,
                       full label sidebar on wide screens.

  RESPONSIVE DESIGN:
  ───────────────────
  - Breakpoint at 860px: navigation links collapse, layouts switch to
    single-column, watermarks hide, and padding reduces.
  - The sidebar on the user dashboard collapses to icon-only mode on
    narrower viewports.

================================================================================
  12. THIRD-PARTY LIBRARIES USED
================================================================================

  All libraries are loaded via CDN (Content Delivery Network). An internet
  connection is required on first load to fetch these resources.

  Library              │ Version  │ Used In              │ Purpose
  ─────────────────────┼──────────┼──────────────────────┼────────────────────
  Google Fonts (Inter) │ Latest   │ All pages            │ Primary UI typeface
  Google Fonts (Rajdhani)│ Latest │ All pages            │ Heading typeface
  Chart.js             │ 4.4.1    │ User Dashboard       │ Network activity
                       │          │                      │ line chart (CDN)
  Feather Icons        │ Latest   │ Admin Dashboard      │ Icon set (SVG icons)
                       │          │                      │ via unpkg CDN
  Inline SVG Icons     │ Custom   │ Login + User Dash    │ Hand-coded SVG paths
                       │          │                      │ (no external library)

  CDN URLs REFERENCED:
  - https://fonts.googleapis.com (Google Fonts)
  - https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js
  - https://unpkg.com/feather-icons

================================================================================
  13. KNOWN LIMITATIONS
================================================================================

  1. NO REAL BACK-END
     All data is stored in localStorage. There is no real database, no
     server, and no actual network or system being monitored. All metrics
     (CPU, RAM, network traffic, service health) are randomly simulated
     in JavaScript.

  2. NO REAL AUTHENTICATION SECURITY
     Passwords stored in localStorage are in plain text. This project is
     a UI prototype/demo and should NOT be used as a real authentication
     system without a proper back-end and hashed credential storage.

  3. DATA IS NOT SHARED ACROSS BROWSERS OR DEVICES
     Since localStorage is browser-local, users on different browsers or
     devices will see different data. There is no synchronization.

  4. NO REAL-TIME SERVER DATA
     All "live" metrics on the dashboard are JavaScript simulations using
     setInterval and Math.random(). They do not reflect any real system state.

  5. OFFLINE MODE — PARTIAL DEGRADATION
     Without internet access, Google Fonts and CDN-hosted libraries
     (Chart.js, Feather Icons) will not load. The page will still function
     but will display system fonts and missing icons/charts.

  6. MOBILE OPTIMIZATION IS PARTIAL
     While a responsive breakpoint is implemented at 860px, the admin
     dashboard's table layout and sidebar are not fully optimized for
     very small screen sizes (below 480px).

================================================================================
  14. FUTURE IMPROVEMENTS
================================================================================

  The following features could be added in a future version:

  - Real back-end integration (Node.js, Python/Django, or PHP) with a
    proper database (PostgreSQL, MongoDB) for persistent, shared data.
  - Hashed password storage using bcrypt or Argon2 for real security.
  - JWT-based session management instead of localStorage.
  - Real system metrics via WebSocket connections to a monitoring agent
    (e.g., Prometheus, Grafana, or a custom Express.js API).
  - Full mobile-responsive layout for all three pages.
  - Dark/Light theme toggle (foundations already in place via CSS variables).
  - Email-based account recovery using an SMTP integration.
  - Multi-language (i18n) support.
  - Audit logging with timestamp records for all admin actions.
  - 2FA (Two-Factor Authentication) via TOTP (e.g., Google Authenticator).
  - Export functionality: download user lists and logs as CSV or PDF.

================================================================================
  15. CREDITS & AUTHORSHIP
================================================================================

  Project Name    : VirtuStat
  Tagline         : Monitor. Analyze. Optimize.
  Type            : Front-End Web Application Prototype
  Interface Style : Dark Terminal / Mission Control Dashboard

  Built with:
    - HTML5
    - CSS3 (Custom Properties, Flexbox, Grid, Animations)
    - Vanilla JavaScript (ES6+)
    - Chart.js (Data Visualization)
    - Feather Icons (Icon Set)
    - Google Fonts — Inter & Rajdhani

  All design, layout, component architecture, JavaScript logic, and
  styling were authored as part of this project.

================================================================================
  END OF README
  VirtuStat © 2025 — All Rights Reserved.
================================================================================
