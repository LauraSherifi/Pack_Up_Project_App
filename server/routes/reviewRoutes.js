const express = require('express');
const router = express.Router();
const reviewModel = require('../models/reviewModel');
const verifyToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Add review (needs login)
router.post('/', verifyToken, authorizeRoles('user', 'trip_planner'), (req, res) => {
  const { trip_id, rating, comment } = req.body;
  const userId = req.user.id;
  const numericRating = Number(rating);

  if (!trip_id) {
    return res.status(400).json({ error: 'trip_id is required' });
  }
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }
  if (comment && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment must be a string' });
  }

  reviewModel.createReview(userId, trip_id, numericRating, comment, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to add review' });
    res.json({ message: 'Review added successfully' });
  });
});

// Get top 3 trips
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

// Get reviews for a trip
router.get('/:tripId', (req, res) => {
  reviewModel.getReviewsByTrip(req.params.tripId, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
    res.json(data);
  });
});

module.exports = router;
