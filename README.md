INSTALL

pip install --break-system-packages psutil



CREATE DATABASE virtustat;
USE virtustat;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    gmail VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM('user','admin') DEFAULT 'user',
    status ENUM('Active','Frozen','Banned') DEFAULT 'Active',

    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,

    failed_attempts INT DEFAULT 0,
    locked_until DATETIME NULL DEFAULT NULL,

    delete_request TINYINT(1) DEFAULT 0,
    delete_requested_at DATETIME NULL DEFAULT NULL
);

CREATE TABLE admin_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM('admin') DEFAULT 'admin',
    status ENUM('Active','Disabled') DEFAULT 'Active',

    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,
    username VARCHAR(50),

    success TINYINT(1),

    ip_address VARCHAR(50),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX(user_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,
    token VARCHAR(255) UNIQUE,

    expires_at DATETIME,
    used TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX(user_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,

    target VARCHAR(255) DEFAULT 'N/A',
    status VARCHAR(20) DEFAULT 'Pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX(username)
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

    session_id VARCHAR(100),
    ip_address VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



IMPLEMENTATION

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
