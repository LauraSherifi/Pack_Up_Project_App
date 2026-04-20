const express = require('express');
const router = express.Router();
const db = require('../config/db'); // fixed path
const authenticateToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendValidationError, validateAdminUserUpdate } = require('../utils/validation');
const { auditFromRequest } = require('../utils/auditLogger');

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

// GET recent audit logs for admin traceability
router.get('/audit-logs', (req, res) => {
  const query = `
    SELECT
      audit_logs.id,
      audit_logs.user_id,
      users.username,
      audit_logs.action,
      audit_logs.entity_type,
      audit_logs.entity_id,
      audit_logs.metadata,
      audit_logs.created_at
    FROM audit_logs
    LEFT JOIN users ON users.id = audit_logs.user_id
    ORDER BY audit_logs.created_at DESC, audit_logs.id DESC
    LIMIT 25
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch audit logs' });
    res.json({ logs: results });
  });
});

// GET recent event logs for admin event monitoring
router.get('/event-logs', (req, res) => {
  const query = `
    SELECT
      id,
      event_type,
      entity_type,
      entity_id,
      payload,
      processed,
      created_at
    FROM event_logs
    ORDER BY created_at DESC, id DESC
    LIMIT 25
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch event logs' });
    res.json({ logs: results });
  });
});

// UPDATE a user (username, role)
router.put('/users/:id', (req, res) => {
  const { username, role } = req.body;
  const { id } = req.params;
  const validationErrors = validateAdminUserUpdate({ username, role });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  const query = 'UPDATE users SET username = ?, role = ? WHERE id = ?';
  db.query(query, [username, role, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update user' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    auditFromRequest(req, {
      action: 'ADMIN_USER_UPDATED',
      entityType: 'user',
      entityId: Number(id),
      metadata: { username, role },
    });
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

                  auditFromRequest(req, {
                    action: 'ADMIN_USER_DELETED',
                    entityType: 'user',
                    entityId: Number(id),
                  });
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
