const db = require('../config/db'); // your mysql connection

const tripModel = {
  // Create a new trip (with optional image)
  createTrip: (tripData, callback) => {
    const sql = `
      INSERT INTO trips (title, description, startDate, endDate, createdBy, img)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      tripData.title,
      tripData.description,
      tripData.startDate,
      tripData.endDate,
      tripData.createdBy,
      tripData.img || null // optional image
    ];
    db.query(sql, params, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Get trips created by a specific user
  getTripsByUser: (userId, callback) => {
    const sql = `SELECT * FROM trips WHERE createdBy = ?`;
    db.query(sql, [userId], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Get a single trip by ID
  getTripById: (tripId, callback) => {
    const sql = `SELECT * FROM trips WHERE id = ?`;
    db.query(sql, [tripId], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // Get all trips (for homepage, admin, or users)
  getAllTrips: (callback) => {
    const sql = `SELECT * FROM trips`;
    db.query(sql, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Update a trip (including optional image)
  updateTrip: (tripId, tripData, callback) => {
    const sql = `
      UPDATE trips
      SET title = ?, description = ?, startDate = ?, endDate = ?, img = ?
      WHERE id = ?
    `;
    const params = [
      tripData.title,
      tripData.description,
      tripData.startDate,
      tripData.endDate,
      tripData.img || null,
      tripId
    ];
    db.query(sql, params, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Delete a trip by ID (with cascade delete for reviews)
  deleteTrip: (tripId, callback) => {
    // First delete all reviews for this trip
    const deleteReviewsSql = `DELETE FROM reviews WHERE trip_id = ?`;
    db.query(deleteReviewsSql, [tripId], (reviewErr, reviewResults) => {
      if (reviewErr) return callback(reviewErr);

      // Then delete the trip
      const deleteTripSql = `DELETE FROM trips WHERE id = ?`;
      db.query(deleteTripSql, [tripId], (tripErr, tripResults) => {
        if (tripErr) return callback(tripErr);
        callback(null, tripResults);
      });
    });
  }
};

module.exports = tripModel;
