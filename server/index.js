const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: Enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');         // /api/auth
const protectedRoutes = require('./routes/protectedRoutes'); // /api/protected (example protected endpoints)
const tripRoutes = require('./routes/trips');               // /api/trips
const adminRoutes = require('./routes/adminRoutes');        // /api/admin
const aboutUsRoute = require('./routes/aboutus');           // /api/about

// Use Routes with prefixes
app.use('/api/about', aboutUsRoute);
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', require('./routes/reviews'));

// ➕ Contact form route with DB save
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('❌ Error saving message:', err);
      return res.status(500).json({ error: 'Database error.' });
    }

    console.log('✅ Message saved with ID:', result.insertId);
    res.status(200).json({ success: true });
  });
});

// Test DB connection route
app.get('/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database test failed' });
    }
    res.json({ message: '✅ Database connected and working!', result: results[0].result });
  });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled server error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
