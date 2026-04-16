const express = require('express');
const router = express.Router();
const db = require('../config/db'); // fixed path
const authenticateToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Protect all routes below - only admin access
router.use(authenticateToken, authorizeRoles('admin'));

// GET all users (excluding admin accounts)
router.get('/users', (req, res) => {
  const query = 'SELECT id, username, email, role FROM users WHERE role != "admin"';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(results);
  });
});

// UPDATE a user (username, role)
router.put('/users/:id', (req, res) => {
  const { username, role } = req.body;
  const { id } = req.params;
  const query = 'UPDATE users SET username = ?, role = ? WHERE id = ?';
  db.query(query, [username, role, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update user' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

// DELETE a user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  db.getConnection((connectionErr, connection) => {
    if (connectionErr) {
      return res.status(500).json({ error: 'Failed to connect to database' });
    }

    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        connection.release();
        return res.status(500).json({ error: 'Failed to start delete transaction' });
      }

      const rollback = (statusCode, message) => {
        connection.rollback(() => {
          connection.release();
          res.status(statusCode).json({ error: message });
        });
      };

      connection.query('SELECT id FROM users WHERE id = ?', [id], (findErr, users) => {
        if (findErr) return rollback(500, 'Failed to find user');
        if (!users || users.length === 0) return rollback(404, 'User not found');

        const deleteTripReviewsQuery = `
          DELETE r
          FROM reviews r
          INNER JOIN trips t ON r.trip_id = t.id
          WHERE t.createdBy = ?
        `;

        connection.query(deleteTripReviewsQuery, [id], (tripReviewErr) => {
          if (tripReviewErr) return rollback(500, 'Failed to delete trip reviews');

          connection.query('DELETE FROM trips WHERE createdBy = ?', [id], (tripErr) => {
            if (tripErr) return rollback(500, 'Failed to delete user trips');

            connection.query('DELETE FROM reviews WHERE user_id = ?', [id], (reviewErr) => {
              if (reviewErr) return rollback(500, 'Failed to delete user reviews');

              connection.query('DELETE FROM users WHERE id = ?', [id], (deleteErr, result) => {
                if (deleteErr) return rollback(500, 'Failed to delete user');
                if (result.affectedRows === 0) return rollback(404, 'User not found');

                connection.commit((commitErr) => {
                  if (commitErr) return rollback(500, 'Failed to commit delete transaction');

                  connection.release();
                  res.json({ message: 'User and related trips deleted successfully' });
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
