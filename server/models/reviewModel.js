const db = require('../config/db');

// Add review
const createReview = (userId, tripId, rating, comment, callback) => {
  const sql = `
    INSERT INTO reviews (user_id, trip_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [userId, tripId, rating, comment], callback);
};

// Get one user's review for a trip
const getReviewByUserAndTrip = (userId, tripId, callback) => {
  const sql = `
    SELECT r.*, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ? AND r.trip_id = ?
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT 1
  `;
  db.query(sql, [userId, tripId], callback);
};

// Get all reviews left by one user
const getReviewsByUser = (userId, callback) => {
  const sql = `
    SELECT
      r.*,
      u.username,
      t.title AS trip_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN trips t ON r.trip_id = t.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [userId], callback);
};

// Update a user's own review
const updateUserReview = (reviewId, userId, rating, comment, callback) => {
  const sql = `
    UPDATE reviews
    SET rating = ?, comment = ?, created_at = NOW()
    WHERE id = ? AND user_id = ?
  `;
  db.query(sql, [rating, comment, reviewId, userId], callback);
};

// Update the current user's review for a trip
const updateUserReviewByTrip = (userId, tripId, rating, comment, callback) => {
  const sql = `
    UPDATE reviews
    SET rating = ?, comment = ?, created_at = NOW()
    WHERE user_id = ? AND trip_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;
  db.query(sql, [rating, comment, userId, tripId], callback);
};

// Remove duplicate reviews for the same user/trip after keeping one review
const deleteDuplicateUserTripReviews = (userId, tripId, keepReviewId, callback) => {
  const sql = `
    DELETE FROM reviews
    WHERE user_id = ? AND trip_id = ? AND id <> ?
  `;
  db.query(sql, [userId, tripId, keepReviewId], callback);
};

// Get reviews for a trip
const getReviewsByTrip = (tripId, callback) => {
  const sql = `
    SELECT r.*, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.trip_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [tripId], callback);
};

// Get all reviews
const getAllReviews = (callback) => {
  const sql = `
    SELECT 
      r.*,
      u.username,
      t.title AS trip_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN trips t ON r.trip_id = t.id
    ORDER BY r.created_at DESC
  `;
  db.query(sql, callback);
};

// Get top trips
const getTopTrips = (callback) => {
  const sql = `
    SELECT 
      t.id,
      t.title,
      AVG(r.rating) AS avgRating,
      COUNT(r.id) AS reviewCount,
      (AVG(r.rating)*0.7 + COUNT(r.id)*0.3) AS score
    FROM trips t
    LEFT JOIN reviews r ON t.id = r.trip_id
    GROUP BY t.id
    ORDER BY score DESC
    LIMIT 3
  `;
  db.query(sql, callback);
};

module.exports = {
  createReview,
  getReviewByUserAndTrip,
  getReviewsByUser,
  updateUserReview,
  updateUserReviewByTrip,
  deleteDuplicateUserTripReviews,
  getAllReviews,
  getReviewsByTrip,
  getTopTrips
};
