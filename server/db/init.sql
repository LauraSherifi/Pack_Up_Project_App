CREATE DATABASE IF NOT EXISTS packup_db;
USE packup_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  startDate DATE NULL,
  endDate DATE NULL,
  createdBy INT NULL,
  img VARCHAR(255) NULL,
  INDEX idx_trips_created_by (createdBy),
  FULLTEXT KEY fulltext_trips_title_description (title, description)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review_user_trip (user_id, trip_id),
  INDEX idx_reviews_trip_id (trip_id),
  INDEX idx_reviews_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_us (
  id INT AUTO_INCREMENT PRIMARY KEY,
  about TEXT NOT NULL,
  mission TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id INT NULL,
  metadata TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS event_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id INT NULL,
  payload TEXT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_event_entity (entity_type, entity_id),
  INDEX idx_event_processed (processed)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  entity_type VARCHAR(80) NULL,
  entity_id INT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_created_at (created_at),
  INDEX idx_notifications_entity (entity_type, entity_id)
);

INSERT INTO users (username, email, password, role)
SELECT 'Admin', 'admin@packup.local', '$2b$10$3wMc7SxTTenuaJCZkRL9SePZnV5MxCtC6eYEEgyLYRUMoWZHH46By', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@packup.local'
);

INSERT INTO about_us (about, mission, value)
SELECT
  'A smarter place for friends, families, and teams to turn trip ideas into shared plans.',
  'We make group travel feel simple, collaborative, and exciting.',
  'Simple tools, shared decisions, and planning spaces where every traveler has a voice.'
WHERE NOT EXISTS (
  SELECT 1 FROM about_us
);
