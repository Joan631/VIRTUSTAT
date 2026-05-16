from flask import Flask, request, jsonify, render_template, session, redirect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

import mysql.connector
import random
import string
import os
import psutil
import time
from datetime import datetime
import platform
import subprocess
import re
from collections import defaultdict

pin_attempts = defaultdict(int)
pin_lock_until = defaultdict(float)

# ============================================================
# FLASK INIT
# ============================================================
app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)

app.secret_key = os.getenv(
    "SECRET_KEY",
    "virtustat_super_secret_key_2026"
)

CORS(app, supports_credentials=True)

# ============================================================
# ADMIN CONFIG
# ============================================================
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
ADMIN_PIN = os.getenv("ADMIN_PIN", "8899")

# ============================================================
# DATABASE CONFIG
# ============================================================
DB_CONFIG = {
    "host": "localhost",
    "user": "virtustat_user",
    "password": "StrongPass123!",
    "database": "virtustat"
}

# ============================================================
# DATABASE CONNECT
# ============================================================
def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# ============================================================
# HELPERS
# ============================================================
def is_logged_in():
    return session.get("user_id") is not None

def is_admin():
    return session.get("role") == "admin"

def get_current_user():
    return {
        "id": session.get("user_id"),
        "username": session.get("username"),
        "role": session.get("role")
    }

def log_system(event_type, message, ip=None):
    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO system_logs (event_type, message, ip_address, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (event_type, message, ip))

        db.commit()

    except Exception as e:
        print("SYSTEM LOG ERROR:", e)

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

# ============================================================
# START TIME
# ============================================================
start_time = time.time()

app.last_net = {
    "time": time.time(),
    "bytes_recv": psutil.net_io_counters().bytes_recv,
    "bytes_sent": psutil.net_io_counters().bytes_sent
}

# ============================================================
# HOME
# ============================================================
@app.route("/")
def home():
    return render_template("VirtuStat.html")

# ============================================================
# USER DASHBOARD
# ============================================================
@app.route("/dashboard")
def dashboard():

    if not is_logged_in():
        return redirect("/")

    return render_template("user.html")

# ============================================================
# ADMIN PAGE
# ============================================================
@app.route("/admin")
def admin_page():

    if not is_admin():
        return redirect("/")

    return render_template("admin.html")

# ============================================================
# LOGOUT
# ============================================================
@app.route("/api/logout", methods=["POST"])
def logout():
    db = cursor = None
    username = session.get("username", "Unknown")

    try:
        db = get_db()
        cursor = db.cursor()

        # log user history
        cursor.execute("""
            INSERT INTO history
            (username, action, details, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (username, "Logout", "User logged out"))

        db.commit()

        log_system(
            "info",
            f"Logout: {username}",
            request.remote_addr
        )

    except Exception as e:
        print("LOGOUT ERROR:", e)

    finally:
        if cursor: cursor.close()
        if db: db.close()

    session.clear()

    return jsonify({"success": True})


@app.route("/api/dashboard/overview")
def dashboard_overview():

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor()

        # USERS
        cursor.execute("SELECT COUNT(*) FROM users")
        users = cursor.fetchone()[0]

        # LOGIN ATTEMPTS
        cursor.execute("SELECT COUNT(*) FROM login_logs")
        login_attempts = cursor.fetchone()[0]

        # ERRORS (FROM YOUR system_logs TABLE)
        cursor.execute("""
            SELECT COUNT(*)
            FROM system_logs
            WHERE event_type = 'error'
        """)
        errors = cursor.fetchone()[0]

        # UPTIME (APP RUN TIME)
        import time
        uptime = int(time.time() - start_time)

        return jsonify({
            "success": True,
            "users": users,
            "login_attempts": login_attempts,
            "errors": errors,
            "uptime": uptime
        })

    except Exception as e:
        print("OVERVIEW ERROR:", e)

        return jsonify({
            "success": False,
            "users": 0,
            "login_attempts": 0,
            "errors": 0,
            "uptime": 0
        })

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

@app.route("/api/system/logs")
def get_system_logs():

    if not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, event_type, message, ip_address, created_at
            FROM system_logs
            ORDER BY created_at DESC
            LIMIT 100
        """)

        rows = cursor.fetchall()

        return jsonify({
            "success": True,
            "logs": [
                {
                    "id": r["id"],
                    "type": r["event_type"],
                    "message": r["message"],
                    "ip": r["ip_address"],
                    "time": r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
                }
                for r in rows
            ]
        })

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()
# ============================================================
# REGISTER
# ============================================================
@app.route("/api/register", methods=["POST"])
def register():
    db = cursor = None
    try:
        data = request.json or {}

        username = data.get("username", "").strip()
        gmail = data.get("gmail", "").strip()
        password = data.get("password", "")

        if not username or not gmail or not password:
            return jsonify({"success": False, "message": "All fields required"})

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id FROM users WHERE username=%s OR gmail=%s
        """, (username, gmail))

        if cursor.fetchone():
            return jsonify({"success": False, "message": "User already exists"})

        hashed_pw = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users (username, gmail, password, role)
            VALUES (%s, %s, %s, %s)
        """, (username, gmail, hashed_pw, "user"))

        db.commit()
        log_system(
            "info",
            f"New user registered: {username}",
            request.remote_addr
        )

        return jsonify({"success": True, "message": "Account created"})

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"success": False, "message": "Server error"})

    finally:
        if cursor: cursor.close()
        if db: db.close()

# ============================================================
# USER LOGIN
# ============================================================
@app.route("/api/login", methods=["POST"])
def login():
    db = cursor = None

    try:
        if not request.is_json:
            return jsonify({"success": False, "message": "Invalid request format"}), 400

        data = request.get_json(silent=True) or {}

        username = (data.get("username") or "").strip()
        password = (data.get("password") or "").strip()

        if not username or not password:
            return jsonify({"success": False, "message": "Missing fields"})

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, username, password, role
            FROM users
            WHERE username=%s
            LIMIT 1
        """, (username,))

        user = cursor.fetchone()

        if not user or not check_password_hash(user["password"], password):

            log_system(
                "error",
                f"Failed login attempt: {username}",
                request.remote_addr
            )

            return jsonify({"success": False, "message": "Invalid username or password"})
        session.clear()

        session["user_id"] = user["id"]
        session["username"] = user["username"]
        session["role"] = user.get("role", "user")
        log_system(
            "info",
            f"Login success: {user['username']}",
            request.remote_addr
        )

        # ============================================================
        # SAVE LOGIN HISTORY
        # ============================================================
        cursor.execute("""
            INSERT INTO history
            (username, action, details, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (
            user["username"],
            "Login",
            "User logged in"
        ))

        db.commit()

        return jsonify({
            "success": True,
            "message": "Login successful",
            "role": session["role"]
        })

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        return jsonify({"success": False, "message": "Server error"}), 500

    finally:
        if cursor: cursor.close()
        if db: db.close()


@app.route("/api/admin/stats")
def admin_stats():
    if not is_admin():
        return jsonify({"success": False}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # total users
    cursor.execute("SELECT COUNT(*) as total FROM users")
    total_users = cursor.fetchone()["total"]

    # delete queue
    cursor.execute("SELECT COUNT(*) as total FROM users WHERE delete_request=1")
    purge_queue = cursor.fetchone()["total"]

    # admin count
    cursor.execute("SELECT COUNT(*) as total FROM users WHERE role='admin'")
    admin_count = cursor.fetchone()["total"]

    cursor.close()
    db.close()

    return jsonify({
        "success": True,
        "data": {
            "nodes": total_users,
            "purge_queue": purge_queue,
            "admins": admin_count
        }
    })

# ============================================================
# ADMIN LOGIN
# ============================================================
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.json or {}
    if data.get("password") != ADMIN_PASSWORD:
        return jsonify({"success": False})

    session.clear()
    session["user_id"] = "admin"
    session["username"] = "admin"
    session["role"] = "admin"

    return jsonify({"success": True})

# ============================================================
# ADMIN PIN
# ============================================================
@app.route("/api/admin/pin", methods=["POST"])
def admin_pin():
    data = request.json or {}
    user_key = request.remote_addr  # or session.get("username") for stronger binding

    now = time.time()

    # =========================
    # CHECK LOCK STATUS
    # =========================
    if pin_lock_until[user_key] > now:
        return jsonify({
            "success": False,
            "message": "Locked. Try again later.",
            "lock_remaining": int(pin_lock_until[user_key] - now)
        }), 403

    # =========================
    # CHECK PIN
    # =========================
    if data.get("pin") == ADMIN_PIN:
        pin_attempts[user_key] = 0
        pin_lock_until[user_key] = 0
        return jsonify({"success": True})

    # =========================
    # WRONG PIN
    # =========================
    pin_attempts[user_key] += 1

    # lock after 5 attempts
    if pin_attempts[user_key] >= 5:
        pin_lock_until[user_key] = now + 30
        pin_attempts[user_key] = 0

        return jsonify({
            "success": False,
            "message": "Too many attempts. Locked for 30 seconds."
        }), 403

    return jsonify({
        "success": False,
        "message": f"Invalid PIN ({pin_attempts[user_key]}/5)"
    }), 401

# ============================================================
# RECOVER ACCOUNT
# ============================================================
@app.route("/api/recover", methods=["POST"])
def recover():

    db = None
    cursor = None

    try:
        data = request.json or {}

        username = data.get("username", "").strip()
        gmail = data.get("gmail", "").strip()

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id
            FROM users
            WHERE username=%s AND gmail=%s
        """, (username, gmail))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Account not found"
            })

        temp_password = ''.join(
            random.choices(
                string.ascii_letters + string.digits,
                k=10
            )
        )

        hashed_pw = generate_password_hash(temp_password)

        cursor.execute("""
            UPDATE users
            SET password=%s
            WHERE id=%s
        """, (
            hashed_pw,
            user["id"]
        ))

        db.commit()

        return jsonify({
            "success": True,
            "password": temp_password
        })

    except Exception as e:
        print("RECOVERY ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error"
        })

    finally:
        try:
            cursor.close()
            db.close()
        except:
            pass

# ============================================================
# GUEST
# ============================================================
@app.route("/api/guest", methods=["POST"])
def guest():
    db = cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO history
            (username, action, details, created_at)
            VALUES (%s, %s, %s, NOW())
        """, ("Guest", "Guest Access", "Entered"))

        db.commit()

    except Exception as e:
        print("GUEST ERROR:", e)

    finally:
        if cursor: cursor.close()
        if db: db.close()

    return jsonify({"success": True})

# ============================================================
# SESSION CHECK
# ============================================================
@app.route("/api/session-check")
def session_check():

    logged = is_logged_in()

    return jsonify({
        "success": logged,
        "logged_in": logged,
        "username": session.get("username"),
        "role": session.get("role")
    })

# ============================================================
# SYSTEM METRICS (FULL COMPLETE FIX)
# ============================================================
@app.route("/api/system")
def system():

    if not is_logged_in():
        return jsonify({"success": False}), 403

    uptime = int(time.time() - start_time)

    # =========================
    # REAL CPU / RAM / DISK
    # =========================
    cpu = round(psutil.cpu_percent(interval=0.3), 1)
    ram = round(psutil.virtual_memory().percent, 1)
    disk = round(psutil.disk_usage(os.path.abspath(os.sep)).percent, 1)

    # =========================
    # REAL NETWORK TOTAL I/O
    # =========================
    net = psutil.net_io_counters()

    now = time.time()
    dt = max(now - app.last_net["time"], 0.001)

    down_speed = (net.bytes_recv - app.last_net["bytes_recv"]) / dt
    up_speed = (net.bytes_sent - app.last_net["bytes_sent"]) / dt

    app.last_net["time"] = now
    app.last_net["bytes_recv"] = net.bytes_recv
    app.last_net["bytes_sent"] = net.bytes_sent

    net_down_mb = round(down_speed / 1024 / 1024, 2)
    net_up_mb = round(up_speed / 1024 / 1024, 2)

    # =========================
    # REAL PACKETS
    # =========================
    packets_in = net.packets_recv
    packets_out = net.packets_sent

    # =========================
    # REAL LATENCY (PING)
    # =========================
    latency = 0
    try:
        if platform.system().lower() == "windows":
            cmd = ["ping", "-n", "1", "8.8.8.8"]
        else:
            cmd = ["ping", "-c", "1", "8.8.8.8"]

        output = subprocess.check_output(cmd).decode(errors="ignore")

        match = re.search(r"time[=<]([\d.]+)", output)
        if match:
            latency = int(float(match.group(1)))

    except:
        latency = 0

    # =========================
    # SERVICES (still simulated unless you attach real daemons)
    # =========================
    services = [
        {
            "name": "Authentication API",
            "status": "Online",
            "cpu": psutil.cpu_percent(),
            "memory": psutil.virtual_memory().percent,
            "response": round(latency + 5),
            "uptime": "99.99%",
            "last_check": time.strftime("%H:%M:%S")
        },
        {
            "name": "Database Server",
            "status": "Online",
            "cpu": psutil.cpu_percent(),
            "memory": psutil.virtual_memory().percent,
            "response": round(latency + 12),
            "uptime": "99.95%",
            "last_check": time.strftime("%H:%M:%S")
        },
        {
            "name": "Analytics Engine",
            "status": "Warning" if cpu > 70 else "Online",
            "cpu": cpu,
            "memory": ram,
            "response": round(latency + 25),
            "uptime": "98.21%",
            "last_check": time.strftime("%H:%M:%S")
        }
    ]

    return jsonify({
        "success": True,

        # GAUGES
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "storage": disk,

        # REAL NETWORK SPEED
        "netDown": net_down_mb,
        "netUp": net_up_mb,

        # REAL NETWORK STATS
        "packets": packets_in + packets_out,

        # REAL LATENCY
        "latency": latency,

        # OPTIONAL TOTALS (useful for admin)
        "total_bytes_in": net.bytes_recv,
        "total_bytes_out": net.bytes_sent,

        # KPI (still optional if you don’t have DB counters yet)
        "users": 0,
        "logins": 0,
        "errors": 0,

        # SERVICES
        "services": services,

        # UPTIME
        "uptime": {
            "hours": uptime // 3600,
            "minutes": (uptime % 3600) // 60,
            "seconds": uptime % 60
        }
    })

# ============================================================
# ME (FIXED - NO MISSING FIELDS)
# ============================================================
@app.route("/api/me")
def me():
    if not is_logged_in():
        return jsonify({})

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT username, gmail, role
        FROM users
        WHERE id=%s
    """, (session["user_id"],))

    user = cursor.fetchone()

    cursor.close()
    db.close()

    return jsonify(user or {})

# ============================================================
# SAVE HISTORY
# ============================================================
@app.route("/api/history", methods=["POST"])
def add_history():
    if not is_logged_in():
        return jsonify({"success": False}), 403

    data = request.json or {}

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO history (username, action, details, created_at)
        VALUES (%s, %s, %s, NOW())
    """, (
        session["username"],
        data.get("action", "Unknown"),
        data.get("details", "")
    ))

    db.commit()

    cursor.close()
    db.close()

    return jsonify({"success": True})

# ============================================================
# GET USER HISTORY
# ============================================================
@app.route("/api/history", methods=["GET"])
def get_history():
    if not is_logged_in():
        return jsonify([])

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT action, details, created_at
        FROM history
        WHERE username=%s
        ORDER BY created_at DESC
        LIMIT 20
    """, (session["username"],))

    rows = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify([
        {
            "label": r["action"],
            "meta": r["details"],
            "time": r["created_at"].strftime("%I:%M %p")
        }
        for r in rows
    ])

# ============================================================
# DELETE ACCOUNT REQUEST
# ============================================================
@app.route("/api/request-delete", methods=["POST"])
def request_delete():

    if not is_logged_in():
        return jsonify({"success": False, "message": "Not logged in"}), 403

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor()

        # 1. mark user for deletion
        cursor.execute("""
            UPDATE users
            SET delete_request = 1,
                delete_requested_at = NOW()
            WHERE id = %s
        """, (session["user_id"],))

        # 2. log into CORRECT table (history)
        cursor.execute("""
            INSERT INTO history
            (username, action, details, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (
            session["username"],
            "Delete Request",
            "User requested account deletion"
        ))

        db.commit()

        return jsonify({
            "success": True,
            "message": "Delete request sent to admin"
        })

    except Exception as e:
        print("DELETE REQUEST ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        try:
            cursor.close()
            db.close()
        except:
            pass

# ============================================================
# CLEAR USER HISTORY
# ============================================================
@app.route("/api/history/clear", methods=["DELETE"])
def clear_history():

    if not is_logged_in():
        return jsonify({
            "success": False
        }), 403

    db = None
    cursor = None

    try:

        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM history
            WHERE username=%s
        """, (session["username"],))

        db.commit()

        return jsonify({
            "success": True
        })

    except Exception as e:

        print("CLEAR HISTORY ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to clear history"
        }), 500

    finally:

        try:
            cursor.close()
            db.close()
        except:
            pass

# ============================================================
# ADMIN GET DELETE REQUESTS
# ============================================================
@app.route("/api/admin/delete-requests")
def admin_delete_requests():

    if not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, username, gmail, delete_requested_at
        FROM users
        WHERE delete_request = 1
        ORDER BY delete_requested_at DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify({
        "success": True,
        "requests": [
            {
                "id": r["id"],
                "username": r["username"],
                "gmail": r["gmail"],
                "date": r["delete_requested_at"].strftime("%Y-%m-%d %H:%M:%S") if r["delete_requested_at"] else ""
            }
            for r in rows
        ]
    })

# ============================================================
# PROFILE UPDATE
# ============================================================
@app.route("/api/profile", methods=["PUT"])
def update_profile():
    if not is_logged_in():
        return jsonify({"success": False}), 403

    data = request.json or {}

    db = get_db()
    cursor = db.cursor()

    username = data.get("username")
    gmail = data.get("gmail")
    password = data.get("password")

    updates = []
    values = []

    if username:
        updates.append("username=%s")
        values.append(username)

    if gmail:
        updates.append("gmail=%s")
        values.append(gmail)

    if password:
        hashed = generate_password_hash(password)
        updates.append("password=%s")
        values.append(hashed)

    if not updates:
        return jsonify({"success": False, "message": "No fields to update"})

    values.append(session["user_id"])

    query = f"""
        UPDATE users
        SET {", ".join(updates)}
        WHERE id=%s
    """

    cursor.execute(query, values)
    db.commit()

    if username:
        session["username"] = username

    cursor.close()
    db.close()

    return jsonify({"success": True})

# ============================================================
# ADMIN APPROVE DELETE
# ============================================================
@app.route("/api/admin/approve-delete", methods=["POST"])
def approve_delete():

    if not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # get username first
        cursor.execute("SELECT username FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        username = user["username"]

        # delete user
        cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))

        # log action
        cursor.execute("""
            INSERT INTO history (username, action, details, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (username, "Account Deleted", "Admin approved delete request"))

        db.commit()

        return jsonify({"success": True})

    finally:
        cursor.close()
        db.close()

# ============================================================
# ADMIN REJECT DELETE
# ============================================================
@app.route("/api/admin/reject-delete", methods=["POST"])
def reject_delete():

    if not is_admin():
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            UPDATE users
            SET delete_request = 0,
                delete_requested_at = NULL
            WHERE id = %s
        """, (user_id,))

        db.commit()

        return jsonify({"success": True})

    finally:
        cursor.close()
        db.close()

# ============================================================
# ADMIN USERS
# ============================================================
@app.route("/api/admin/users")
def admin_users():

    if not is_admin():
        return jsonify({
            "success": False
        }), 403

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                username,
                gmail,
                role
            FROM users
            ORDER BY id DESC
        """)

        users = cursor.fetchall()

        return jsonify({
            "success": True,
            "users": users
        })

    except Exception as e:
        print("ADMIN USERS ERROR:", e)

        return jsonify({
            "success": False
        })

    finally:
        try:
            cursor.close()
            db.close()
        except:
            pass

# ============================================================
# ADMIN USER LOGS
# ============================================================
# ============================================================
# ADMIN USER LOGIN HISTORY
# ============================================================
@app.route("/api/admin/user-logs/<username>")
def admin_user_logs(username):

    if not is_admin():
        return jsonify({
            "success": False
        }), 403

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                action,
                details,
                created_at
            FROM history
            WHERE username=%s
            AND (
                action='Login'
                OR action='Logout'
                OR action='Guest Access'
            )
            ORDER BY created_at DESC
            LIMIT 50
        """, (username,))

        rows = cursor.fetchall()

        logs = []

        for row in rows:

            logs.append({
                "action": row["action"],
                "details": row["details"],
                "time": row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            })

        return jsonify({
            "success": True,
            "logs": logs
        })

    except Exception as e:
        print("USER LOGS ERROR:", e)

        return jsonify({
            "success": False,
            "logs": []
        })

    finally:
        try:
            cursor.close()
            db.close()
        except:
            pass
# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
