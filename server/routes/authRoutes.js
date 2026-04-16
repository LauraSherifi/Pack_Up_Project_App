const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;

// Register Route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const allowedRoles = ['user', 'trip_planner'];
  const role = allowedRoles.includes(req.body.role) ? req.body.role : 'user';

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    userModel.createUser({ username, email, password: hashedPassword, role }, (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Failed to register user' });
      }
      res.json({ message: 'User registered!' });
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  userModel.findUserByEmail(email, async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

      res.json({
        message: 'Logged in',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (compareErr) {
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;
