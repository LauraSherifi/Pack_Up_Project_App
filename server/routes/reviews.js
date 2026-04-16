const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const reviewModel = require('../models/reviewModel');

// POST /api/reviews
router.post('/', verifyToken, authorizeRoles('user'), (req, res) => {
  const tripId = req.body.tripId || req.body.trip_id;
  const rating = Number(req.body.rating);
  const comment = req.body.comment || '';
  const userId = req.user.id;

  if (!tripId) {
    return res.status(400).json({ error: 'tripId is required' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }
  if (comment && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment must be a string' });
  }

  const sql = `
    INSERT INTO reviews (trip_id, user_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(sql, [tripId, userId, rating, comment], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add review' });
    return res.status(201).json({
      success: true,
      reviewId: result.insertId,
      message: 'Review added successfully',
    });
  });
});

// Keep existing read endpoints
router.get('/', verifyToken, (req, res) => {
  reviewModel.getAllReviews((err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
    res.json({ reviews: data });
  });
});

router.get('/top/all', (req, res) => {
  reviewModel.getTopTrips((err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch top trips' });
    res.json(data);
  });
});

router.get('/:tripId', (req, res) => {
  reviewModel.getReviewsByTrip(req.params.tripId, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
    res.json(data);
  });
});

// Delete a review by admin
router.delete('/:id', verifyToken, authorizeRoles('admin'), (req, res) => {
  const reviewId = req.params.id;
  const sql = 'DELETE FROM reviews WHERE id = ?';

  db.query(sql, [reviewId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete review' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  });
});

module.exports = router;
