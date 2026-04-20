const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/', (req, res) => {
  const sql = `
    SELECT id, title, message, type, entity_type, entity_id, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 50
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notifications' });
    res.json({ notifications: results });
  });
});

router.get('/unread-count', (req, res) => {
  const sql = 'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0';

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch unread notifications' });
    res.json({ unreadCount: results[0]?.unreadCount || 0 });
  });
});

router.put('/:id/read', (req, res) => {
  const sql = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?';

  db.query(sql, [req.params.id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update notification' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  });
});

router.put('/read-all', (req, res) => {
  const sql = 'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0';

  db.query(sql, [req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update notifications' });
    res.json({ message: 'Notifications marked as read' });
  });
});

module.exports = router;
