```
VirtuStat/
│
├── static/
│   ├── css/
│   │   ├── admin.css          # Styling for the Administrator dashboard
│   │   ├── user.css           # Styling for the standard user portal
│   │   └── VirtuStat.css      # Core landing and authentication page styling
│   │
│   ├── js/
│   │   ├── admin.js           # Client-side logic for admin controls and charting
│   │   ├── user.js            # Client-side logic for user interactions and metrics
│   │   └── VirtuStat.js       # Login handling, registration, and recovery logic
│
├── templates/
│   ├── admin.html             # High-level Administrator dashboard view
│   ├── user.html              # Standard authenticated user dashboard
│   └── VirtuStat.html         # Main entry point (Login/Register/Guest)
│
├── app.py                     # Main Flask Backend Logic, Routing, & API
├── virtustat.service          # Systemd configuration for persistent deployment
├── README.txt                 # Documentation and setup instructions
└── .gitignore                 # Excluded files for version control

--------------------------------------------------------------------------------
INSTALLATION & SETUP (Linux/VM)
--------------------------------------------------------------------------------

1. System Update & Dependencies
Ensure your base system is up to date and install required core packages.
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv ufw mysql-server -y
```

2. Clone / Upload Project
Place the project folder in your VM environment (e.g., /home/group2/VirtuStat).

3. Create Virtual Environment
Isolate project dependencies using a Python virtual environment.
```bash
cd /home/group2/VirtuStat
python3 -m venv venv
source venv/bin/activate
```

4. Install Required Python Packages
With the virtual environment active, install the necessary libraries.
```bash
pip install Flask mysql-connector-python psutil flask-cors werkzeug
```

5. MySQL Database Setup
Log in to the MySQL terminal (`sudo mysql`) and execute the following commands 
to create the database, user, and necessary tables based on the architecture.

```sql
CREATE DATABASE virtustat;

CREATE USER 'virtustat_user'@'localhost' IDENTIFIED BY 'StrongPass123!';
GRANT ALL PRIVILEGES ON virtustat.* TO 'virtustat_user'@'localhost';
FLUSH PRIVILEGES;

USE virtustat;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    gmail VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('Active', 'Frozen', 'Banned') DEFAULT 'Active',
    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    failed_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    delete_request TINYINT(1) DEFAULT 0,
    delete_requested_at DATETIME NULL
);

CREATE TABLE admin_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    role ENUM('admin') DEFAULT 'admin',
    status ENUM('Active', 'Disabled') DEFAULT 'Active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50),
    success TINYINT(1),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50),
    message TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guest_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) UNIQUE,
    expires_at DATETIME,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    target VARCHAR(255) DEFAULT 'N/A',
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

6. Firewall Setup (UFW)
Secure the VM by allowing only SSH and the application port.
```bash
sudo ufw enable
sudo ufw allow 5000/tcp
sudo ufw allow 22/tcp
```

--------------------------------------------------------------------------------
RUNNING THE APPLICATION
--------------------------------------------------------------------------------

Option A: Development Mode
Run the application directly for testing and development.
```bash
python3 app.py
```
Access locally via: http://localhost:5000
Access remotely via: http://<VM_IP>:5000

Option B: Production Deployment (systemd)
Ensure the application runs persistently in the background.

1. Create or edit the service file:
```bash
sudo nano /etc/systemd/system/virtustat.service
```

2. Paste the configuration (adjust 'User' and paths as necessary for your environment):
```ini
[Unit]
Description=VirtuStat Flask Backend
After=network.target mysql.service

[Service]
User=group2
WorkingDirectory=/home/group2/VirtuStat
ExecStart=/usr/bin/python3 /home/group2/VirtuStat/app.py
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

3. Enable and Start the Service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable virtustat
sudo systemctl start virtustat
```
