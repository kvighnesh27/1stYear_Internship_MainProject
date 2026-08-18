CREATE DATABASE IF NOT EXISTS osint_db_checking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE osint_db_checking;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'individual',
  company_name VARCHAR(100) DEFAULT NULL,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  INDEX ix_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scan_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  target_input VARCHAR(255) NOT NULL,
  scan_type VARCHAR(50) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  executive_summary TEXT NOT NULL,
  threat_actor_exploitation TEXT DEFAULT NULL,
  infrastructure_map JSON DEFAULT NULL,
  total_threat_count INT NOT NULL DEFAULT 0,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scan_results_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_history (user_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Multi-Agent storage table
CREATE TABLE IF NOT EXISTS ai_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  scan_id INT NOT NULL,
  detailed_output TEXT NOT NULL,
  summarized_output JSON NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aireports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aireports_scan FOREIGN KEY (scan_id) REFERENCES scan_results(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fetched_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scan_id INT NOT NULL,
  vector_name VARCHAR(50) NOT NULL,
  source_title VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  CONSTRAINT fk_fetched_sources_scan FOREIGN KEY (scan_id) REFERENCES scan_results(id) ON DELETE CASCADE,
  INDEX idx_scan_sources (scan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT email, role, approval_status FROM users;
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT DEFAULT NULL,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;






