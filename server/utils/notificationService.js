const db = require('../config/db');

const createNotification = ({ userId, title, message, type = 'info', entityType = null, entityId = null }) => {
  if (!userId || !title || !message) return;

  const sql = `
    INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [userId, title, message, type, entityType, entityId], (err) => {
    if (err) {
      console.warn('Notification write failed:', err.message);
    }
  });
};

const createNotificationForRole = ({ role, title, message, type = 'info', entityType = null, entityId = null }) => {
  if (!role || !title || !message) return;

  db.query('SELECT id FROM users WHERE role = ?', [role], (err, users) => {
    if (err) {
      console.warn('Notification role lookup failed:', err.message);
      return;
    }

    users.forEach((user) => {
      createNotification({
        userId: user.id,
        title,
        message,
        type,
        entityType,
        entityId,
      });
    });
  });
};

const notifyTripOwner = ({ tripId, title, message, type = 'info', entityType = 'trip', entityId = null }) => {
  if (!tripId || !title || !message) return;

  db.query('SELECT createdBy FROM trips WHERE id = ?', [tripId], (err, trips) => {
    if (err) {
      console.warn('Notification trip owner lookup failed:', err.message);
      return;
    }

    const ownerId = trips[0]?.createdBy;
    if (!ownerId) return;

    createNotification({
      userId: ownerId,
      title,
      message,
      type,
      entityType,
      entityId: entityId || tripId,
    });
  });
};

module.exports = {
  createNotification,
  createNotificationForRole,
  notifyTripOwner,
};
