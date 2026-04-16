const db = require('../config/db');

// Add review
const createReview = (userId, tripId, rating, comment, callback) => {
  const sql = `
    INSERT INTO reviews (user_id, trip_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [userId, tripId, rating, comment], callback);
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
  getAllReviews,
  getReviewsByTrip,
  getTopTrips
};
