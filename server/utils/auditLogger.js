const db = require('../config/db');

const toMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  try {
    return JSON.stringify(metadata);
  } catch (err) {
    return JSON.stringify({ serializationError: true });
  }
};

const writeAuditLog = ({ userId = null, action, entityType, entityId = null, metadata = {} }) => {
  if (!action || !entityType) return;

  const sql = `
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [userId, action, entityType, entityId, toMetadata(metadata)], (err) => {
    if (err) {
      console.warn('Audit log write failed:', err.message);
    }
  });
};

const auditFromRequest = (req, details) => {
  writeAuditLog({
    userId: req.user?.id || null,
    ...details,
  });
};

module.exports = {
  auditFromRequest,
  writeAuditLog,
};
