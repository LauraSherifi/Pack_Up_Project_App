const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const reviewModel = require('../models/reviewModel');
const { sendValidationError, validateReview } = require('../utils/validation');
const { auditFromRequest } = require('../utils/auditLogger');
const { deleteCache, getCache, setCache } = require('../utils/cache');
const { publishEvent } = require('../utils/eventLogger');
const { notifyTripOwner } = require('../utils/notificationService');

const TOP_TRIPS_CACHE_KEY = 'reviews:top-trips';
const TOP_TRIPS_CACHE_TTL_MS = 60 * 1000;

const clearTopTripsCache = () => {
  deleteCache(TOP_TRIPS_CACHE_KEY).catch((err) => {
    console.warn('Top trips cache clear failed:', err.message);
  });
};

// POST /api/reviews
router.post('/', verifyToken, authorizeRoles('user'), (req, res) => {
  const tripId = req.body.tripId || req.body.trip_id;
  const rating = Number(req.body.rating);
  const comment = req.body.comment || '';
  const userId = req.user.id;
  const validationErrors = validateReview({ tripId, rating, comment });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  reviewModel.getReviewByUserAndTrip(userId, tripId, (findErr, existingReviews) => {
    if (findErr) return res.status(500).json({ error: 'Failed to check existing review' });

    if (existingReviews.length > 0) {
      return res.status(409).json({
        error: 'You have already reviewed this trip',
        review: existingReviews[0],
      });
    }

    const sql = `
      INSERT INTO reviews (trip_id, user_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(sql, [tripId, userId, rating, comment], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return reviewModel.getReviewByUserAndTrip(userId, tripId, (duplicateFindErr, duplicateReviews) => {
            if (duplicateFindErr) return res.status(500).json({ error: 'Failed to check existing review' });

            return res.status(409).json({
              error: 'You have already reviewed this trip',
              review: duplicateReviews[0] || null,
            });
          });
        }

        return res.status(500).json({ error: 'Failed to add review' });
      }
      auditFromRequest(req, {
        action: 'REVIEW_CREATED',
        entityType: 'review',
        entityId: result.insertId,
        metadata: { tripId, rating },
      });
      publishEvent({
        eventType: 'REVIEW_CREATED',
        entityType: 'review',
        entityId: result.insertId,
        payload: { tripId, userId, rating },
      });
      notifyTripOwner({
        tripId,
        title: 'New review received',
        message: `A traveler left a ${rating}/5 review on one of your trips.`,
        type: 'review',
        entityType: 'review',
        entityId: result.insertId,
      });
      clearTopTripsCache();
      return res.status(201).json({
        success: true,
        reviewId: result.insertId,
        message: 'Review added successfully',
      });
    });
  });
});

// GET /api/reviews/mine
router.get('/mine', verifyToken, authorizeRoles('user'), (req, res) => {
  reviewModel.getReviewsByUser(req.user.id, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch your reviews' });
    return res.json({ reviews: data });
  });
});

// GET /api/reviews/mine/:tripId
router.get('/mine/:tripId', verifyToken, authorizeRoles('user'), (req, res) => {
  reviewModel.getReviewByUserAndTrip(req.user.id, req.params.tripId, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch your review' });
    return res.json({ review: data[0] || null });
  });
});

// PUT /api/reviews/mine/:tripId
router.put('/mine/:tripId', verifyToken, authorizeRoles('user'), (req, res) => {
  const tripId = req.params.tripId;
  const rating = Number(req.body.rating);
  const comment = req.body.comment || '';
  const userId = req.user.id;
  const validationErrors = validateReview({ tripId, rating, comment });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  reviewModel.updateUserReviewByTrip(userId, tripId, rating, comment, (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update review' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found for this user and trip' });
    }

    reviewModel.getReviewByUserAndTrip(userId, tripId, (findErr, reviews) => {
      if (findErr) return res.status(500).json({ error: 'Review updated, but failed to refresh it' });

      const updatedReview = reviews[0] || null;
      if (!updatedReview) {
        return res.json({ success: true, message: 'Review updated successfully', review: null });
      }

      reviewModel.deleteDuplicateUserTripReviews(userId, tripId, updatedReview.id, (deleteErr) => {
        if (deleteErr) {
          auditFromRequest(req, {
            action: 'REVIEW_UPDATED',
            entityType: 'review',
            entityId: updatedReview.id,
            metadata: { tripId, rating, duplicateCleanup: 'failed' },
          });
          publishEvent({
            eventType: 'REVIEW_UPDATED',
            entityType: 'review',
            entityId: updatedReview.id,
            payload: { tripId, userId, rating },
          });
          notifyTripOwner({
            tripId,
            title: 'Review updated',
            message: `A traveler updated a review to ${rating}/5 on one of your trips.`,
            type: 'review',
            entityType: 'review',
            entityId: updatedReview.id,
          });
          clearTopTripsCache();
          return res.json({
            success: true,
            message: 'Review updated successfully, but duplicate cleanup failed',
            review: updatedReview,
          });
        }

        auditFromRequest(req, {
          action: 'REVIEW_UPDATED',
          entityType: 'review',
          entityId: updatedReview.id,
          metadata: { tripId, rating },
        });
        publishEvent({
          eventType: 'REVIEW_UPDATED',
          entityType: 'review',
          entityId: updatedReview.id,
          payload: { tripId, userId, rating },
        });
        notifyTripOwner({
          tripId,
          title: 'Review updated',
          message: `A traveler updated a review to ${rating}/5 on one of your trips.`,
          type: 'review',
          entityType: 'review',
          entityId: updatedReview.id,
        });
        clearTopTripsCache();
        return res.json({
          success: true,
          message: 'Review updated successfully',
          review: updatedReview,
        });
      });
    });
  });
});

// PUT /api/reviews/:id
router.put('/:id', verifyToken, authorizeRoles('user'), (req, res) => {
  const reviewId = req.params.id;
  const rating = Number(req.body.rating);
  const comment = req.body.comment || '';
  const userId = req.user.id;
  const validationErrors = validateReview({ tripId: req.body.tripId || req.body.trip_id, rating, comment }, { requireTripId: false });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  reviewModel.updateUserReview(reviewId, userId, rating, comment, (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update review' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found for this user' });
    }
    auditFromRequest(req, {
      action: 'REVIEW_UPDATED',
      entityType: 'review',
      entityId: Number(reviewId),
      metadata: { rating },
    });
    publishEvent({
      eventType: 'REVIEW_UPDATED',
      entityType: 'review',
      entityId: Number(reviewId),
      payload: { userId, rating },
    });
    clearTopTripsCache();
    return res.json({ success: true, message: 'Review updated successfully' });
  });
});

// Keep existing read endpoints
router.get('/', verifyToken, (req, res) => {
  reviewModel.getAllReviews((err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
    res.json({ reviews: data });
  });
});

router.get('/top/all', async (req, res) => {
  try {
    const cachedTopTrips = await getCache(TOP_TRIPS_CACHE_KEY);
    if (cachedTopTrips) {
      return res.json(cachedTopTrips);
    }
  } catch (cacheErr) {
    console.warn('Top trips cache read failed:', cacheErr.message);
  }

  reviewModel.getTopTrips((err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch top trips' });
    setCache(TOP_TRIPS_CACHE_KEY, data, TOP_TRIPS_CACHE_TTL_MS).catch((cacheErr) => {
      console.warn('Top trips cache write failed:', cacheErr.message);
    });
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
    auditFromRequest(req, {
      action: 'REVIEW_DELETED',
      entityType: 'review',
      entityId: Number(reviewId),
    });
    publishEvent({
      eventType: 'REVIEW_DELETED',
      entityType: 'review',
      entityId: Number(reviewId),
    });
    clearTopTripsCache();
    res.json({ success: true, message: 'Review deleted successfully' });
  });
});

module.exports = router;
