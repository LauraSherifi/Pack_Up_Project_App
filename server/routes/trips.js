const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const tripModel = require('../models/tripModel');
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

// ✅ Get all trips (any authenticated user)
router.get('/', authMiddleware, (req, res) => {
  const sql = 'SELECT * FROM trips';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching trips' });
    res.status(200).json({ trips: results });
  });
});

// ✅ Get current planner's trips
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

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const createdBy = req.user.id;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

  tripModel.createTrip({ title, description, startDate, endDate, createdBy, img: imgPath }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error saving trip' });
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

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  tripModel.updateTrip(tripId, { title, description, startDate, endDate, img }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error updating trip' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Trip not found' });
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
    res.status(200).json({ message: 'Trip deleted successfully' });
  });
});

module.exports = router;
