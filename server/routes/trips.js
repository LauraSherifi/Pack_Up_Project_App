const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const tripModel = require('../models/tripModel');
const { sendValidationError, validateTrip } = require('../utils/validation');
const { auditFromRequest } = require('../utils/auditLogger');
const { publishEvent } = require('../utils/eventLogger');
const { createNotificationForRole } = require('../utils/notificationService');
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });


// === ROUTES ===

const runTripSearch = (q, callback) => {
  const likeQuery = `%${q}%`;
  const startsWithQuery = `${q}%`;
  const fullTextSql = `
    SELECT *,
      MATCH(title, description) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance,
      CASE
        WHEN LOWER(title) = LOWER(?) THEN 100
        WHEN LOWER(title) LIKE LOWER(?) THEN 80
        WHEN LOWER(title) LIKE LOWER(?) THEN 60
        WHEN LOWER(description) LIKE LOWER(?) THEN 20
        ELSE 0
      END AS search_rank
    FROM trips
    WHERE MATCH(title, description) AGAINST (? IN NATURAL LANGUAGE MODE)
       OR title LIKE ?
       OR description LIKE ?
    ORDER BY search_rank DESC, relevance DESC, title ASC
  `;

  db.query(fullTextSql, [q, q, startsWithQuery, likeQuery, likeQuery, q, likeQuery, likeQuery], (err, results) => {
    if (!err) {
      callback(null, results);
      return;
    }

    if (err.code !== 'ER_FT_MATCHING_KEY_NOT_FOUND') {
      callback(err);
      return;
    }

    const fallbackSql = `
      SELECT *,
        CASE
          WHEN LOWER(title) = LOWER(?) THEN 100
          WHEN LOWER(title) LIKE LOWER(?) THEN 80
          WHEN LOWER(title) LIKE LOWER(?) THEN 60
          WHEN LOWER(description) LIKE LOWER(?) THEN 20
          ELSE 0
        END AS search_rank
      FROM trips
      WHERE title LIKE ?
         OR description LIKE ?
      ORDER BY search_rank DESC, title ASC
    `;

    db.query(fallbackSql, [q, startsWithQuery, likeQuery, likeQuery, likeQuery, likeQuery], callback);
  });
};

// ✅ Get all trips (any authenticated user)
router.get('/', authMiddleware, (req, res) => {
  const sql = 'SELECT * FROM trips';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching trips' });
    res.status(200).json({ trips: results });
  });
});

// ✅ Get current planner's trips
// Search trips by destination title or description
router.get('/search', authMiddleware, (req, res) => {
  const q = String(req.query.q || '').trim();

  if (!q) {
    return res.status(200).json({ trips: [] });
  }

  runTripSearch(q, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error searching trips' });
    res.status(200).json({ trips: results });
  });
});

// Get current planner's trips
router.get('/my-trips', authMiddleware, authorizeRoles('trip_planner'), (req, res) => {
  const sql = 'SELECT * FROM trips WHERE createdBy = ?';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching trips' });
    res.status(200).json({ trips: results });
  });
});

// ✅ Create trip with optional image (trip planners only)
router.post('/', authMiddleware, authorizeRoles('trip_planner'), upload.single('img'), (req, res) => {
  const { title, description, startDate, endDate } = req.body;
  const validationErrors = validateTrip({ title, startDate, endDate });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  const createdBy = req.user.id;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

  tripModel.createTrip({ title, description, startDate, endDate, createdBy, img: imgPath }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error saving trip' });
    auditFromRequest(req, {
      action: 'TRIP_CREATED',
      entityType: 'trip',
      entityId: result.insertId,
      metadata: { title, startDate, endDate },
    });
    publishEvent({
      eventType: 'TRIP_CREATED',
      entityType: 'trip',
      entityId: result.insertId,
      payload: { title, startDate, endDate, createdBy },
    });
    createNotificationForRole({
      role: 'user',
      title: 'New trip available',
      message: `${title} is now available to view and review.`,
      type: 'trip',
      entityType: 'trip',
      entityId: result.insertId,
    });
    res.status(201).json({
      message: 'Trip created successfully!',
      trip: {
        id: result.insertId,
        title,
        description,
        startDate,
        endDate,
        createdBy,
        img: imgPath
      }
    });
  });
});


// ✅ Update trip
router.put('/:id', authMiddleware, authorizeRoles('trip_planner', 'admin'), upload.single('img'), (req, res) => {
  const tripId = req.params.id;
  const { title, description, startDate, endDate } = req.body;
  const img = req.file ? '/uploads/' + req.file.filename : req.body.img;
  const validationErrors = validateTrip({ title, startDate, endDate });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  tripModel.updateTrip(tripId, { title, description, startDate, endDate, img }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error updating trip' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Trip not found' });
    auditFromRequest(req, {
      action: 'TRIP_UPDATED',
      entityType: 'trip',
      entityId: Number(tripId),
      metadata: { title, startDate, endDate },
    });
    publishEvent({
      eventType: 'TRIP_UPDATED',
      entityType: 'trip',
      entityId: Number(tripId),
      payload: { title, startDate, endDate },
    });
    res.status(200).json({ message: 'Trip updated successfully' });
  });
});

// ✅ Get one trip
router.get('/:id', authMiddleware, (req, res) => {
  const tripId = req.params.id;
  tripModel.getTripById(tripId, (err, trip) => {
    if (err) return res.status(500).json({ message: 'Error fetching trip' });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json({ trip });
  });
});

// ✅ Delete trip
router.delete('/:id', authMiddleware, authorizeRoles('trip_planner', 'admin'), (req, res) => {
  const tripId = req.params.id;
  tripModel.deleteTrip(tripId, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting trip' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Trip not found' });
    auditFromRequest(req, {
      action: 'TRIP_DELETED',
      entityType: 'trip',
      entityId: Number(tripId),
    });
    publishEvent({
      eventType: 'TRIP_DELETED',
      entityType: 'trip',
      entityId: Number(tripId),
    });
    res.status(200).json({ message: 'Trip deleted successfully' });
  });
});

module.exports = router;
