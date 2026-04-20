-- WARNING:
-- This script recreates the PackUp demo database.
-- Running it will delete existing packup_db data on the MySQL server where it is executed.
-- Use it for professor/demo setup, not for preserving your current local data.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS packup_db;
CREATE DATABASE packup_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE packup_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trips (
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

CREATE TABLE reviews (
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

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE about_us (
  id INT AUTO_INCREMENT PRIMARY KEY,
  about TEXT NOT NULL,
  mission TEXT NOT NULL,
  `value` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
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

CREATE TABLE event_logs (
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

CREATE TABLE notifications (
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

INSERT INTO users (id, username, email, password, role, created_at) VALUES
  (1, 'Admin', 'admin@packup.local', '$2b$10$a/4xf79iZoj8BNvNgMqRw.8RUQP6mUf7QKlwmXlNqSDWCBqOb4zmi', 'admin', NOW()),
  (2, 'PackUp Planner', 'planner@packup.local', '$2b$10$c9bhg/yMl0mY3zQ2JGoXGug5bb92zwiON4kK8KteZ5mQTLS.McIQm', 'trip_planner', NOW()),
  (3, 'Demo Traveler', 'user@packup.local', '$2b$10$1RuE5yWGX151tloIabTp4ugJhpIjPxKye4jDtw9UDesSJxgMBBxf2', 'user', NOW()),
  (4, 'Second Traveler', 'traveler2@packup.local', '$2b$10$1RuE5yWGX151tloIabTp4ugJhpIjPxKye4jDtw9UDesSJxgMBBxf2', 'user', NOW());

INSERT INTO trips (id, title, description, startDate, endDate, createdBy, img) VALUES
  (1, 'Tokyo', 'Explore city lights, peaceful temples, local food, and modern Japanese culture.', '2026-06-10', '2026-06-18', 2, '/img/slider1.jpg'),
  (2, 'London', 'Visit museums, historic streets, parks, markets, and classic city landmarks.', '2026-07-02', '2026-07-09', 2, '/img/slider2.jpg'),
  (3, 'Rome', 'Walk through ancient history, enjoy Italian food, and visit famous cultural sites.', '2026-08-14', '2026-08-21', 2, '/img/slider3.jpg');

INSERT INTO reviews (id, user_id, trip_id, rating, comment, created_at) VALUES
  (1, 3, 1, 5, 'Tokyo looks amazing and very well planned.', NOW()),
  (2, 4, 1, 4, 'Great itinerary with a lot of interesting places.', NOW()),
  (3, 3, 2, 4, 'London has a nice balance of culture and sightseeing.', NOW()),
  (4, 4, 3, 5, 'Rome is perfect for history and food lovers.', NOW());

INSERT INTO contact_messages (id, name, email, message, created_at) VALUES
  (1, 'Demo Traveler', 'user@packup.local', 'I would like more details about the Tokyo trip.', NOW()),
  (2, 'Second Traveler', 'traveler2@packup.local', 'Can travelers suggest activities for future trips?', NOW());

INSERT INTO about_us (id, about, mission, `value`) VALUES
  (
    1,
    'PackUp is a travel planning platform for organizing trips, browsing destinations, and collecting traveler feedback.',
    'Our mission is to make group travel planning simpler, more collaborative, and easier to manage.',
    'We value simple tools, shared decisions, clear communication, and useful feedback from travelers.'
  );

INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata, created_at) VALUES
  (1, 2, 'TRIP_CREATED', 'trip', 1, '{"title":"Tokyo"}', NOW()),
  (2, 3, 'REVIEW_CREATED', 'review', 1, '{"tripId":1,"rating":5}', NOW()),
  (3, 1, 'ADMIN_USER_UPDATED', 'user', 3, '{"role":"user"}', NOW());

INSERT INTO event_logs (id, event_type, entity_type, entity_id, payload, processed, created_at) VALUES
  (1, 'TRIP_CREATED', 'trip', 1, '{"title":"Tokyo","createdBy":2}', 1, NOW()),
  (2, 'REVIEW_CREATED', 'review', 1, '{"tripId":1,"userId":3,"rating":5}', 1, NOW()),
  (3, 'REVIEW_UPDATED', 'review', 2, '{"tripId":1,"userId":4,"rating":4}', 0, NOW());

INSERT INTO notifications (id, user_id, title, message, type, entity_type, entity_id, is_read, created_at) VALUES
  (1, 3, 'New trip available', 'Tokyo is now available to view and review.', 'trip', 'trip', 1, 0, NOW()),
  (2, 4, 'New trip available', 'Rome is now available to view and review.', 'trip', 'trip', 3, 0, NOW()),
  (3, 2, 'New review received', 'A traveler left a 5/5 review on one of your trips.', 'review', 'review', 1, 0, NOW()),
  (4, 2, 'Review updated', 'A traveler updated a review to 4/5 on one of your trips.', 'review', 'review', 2, 1, NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- Demo login accounts:
-- admin@packup.local / admin123
-- planner@packup.local / planner123
-- user@packup.local / user123
-- traveler2@packup.local / user123
