const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');
const { sendValidationError, validateContact } = require('./utils/validation');
const { writeAuditLog } = require('./utils/auditLogger');
const openApiSpec = require('./docs/openapi');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: Enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'packup-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (req, res) => {
  db.query('SELECT 1 AS ready', (err) => {
    if (err) {
      return res.status(503).json({
        status: 'not_ready',
        service: 'packup-api',
        database: 'unavailable',
      });
    }

    return res.json({
      status: 'ready',
      service: 'packup-api',
      database: 'available',
      timestamp: new Date().toISOString(),
    });
  });
});

app.get('/metrics', (req, res) => {
  const countsSql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM trips) AS trips,
      (SELECT COUNT(*) FROM reviews) AS reviews,
      (SELECT COUNT(*) FROM contact_messages) AS contactMessages,
      (SELECT COUNT(*) FROM audit_logs) AS auditLogs,
      (SELECT COUNT(*) FROM event_logs) AS eventLogs,
      (SELECT COUNT(*) FROM notifications) AS notifications
  `;

  db.query(countsSql, (err, rows) => {
    if (err) {
      return res.status(503).type('text/plain').send([
        '# HELP packup_database_available Database availability, 1 for available and 0 for unavailable',
        '# TYPE packup_database_available gauge',
        'packup_database_available 0',
      ].join('\n'));
    }

    const counts = rows[0] || {};
    const metrics = [
      '# HELP packup_uptime_seconds API process uptime in seconds',
      '# TYPE packup_uptime_seconds gauge',
      `packup_uptime_seconds ${process.uptime().toFixed(0)}`,
      '# HELP packup_database_available Database availability, 1 for available and 0 for unavailable',
      '# TYPE packup_database_available gauge',
      'packup_database_available 1',
      '# HELP packup_users_total Total users',
      '# TYPE packup_users_total gauge',
      `packup_users_total ${counts.users || 0}`,
      '# HELP packup_trips_total Total trips',
      '# TYPE packup_trips_total gauge',
      `packup_trips_total ${counts.trips || 0}`,
      '# HELP packup_reviews_total Total reviews',
      '# TYPE packup_reviews_total gauge',
      `packup_reviews_total ${counts.reviews || 0}`,
      '# HELP packup_contact_messages_total Total contact messages',
      '# TYPE packup_contact_messages_total gauge',
      `packup_contact_messages_total ${counts.contactMessages || 0}`,
      '# HELP packup_audit_logs_total Total audit log entries',
      '# TYPE packup_audit_logs_total gauge',
      `packup_audit_logs_total ${counts.auditLogs || 0}`,
      '# HELP packup_event_logs_total Total event log entries',
      '# TYPE packup_event_logs_total gauge',
      `packup_event_logs_total ${counts.eventLogs || 0}`,
      '# HELP packup_notifications_total Total notification entries',
      '# TYPE packup_notifications_total gauge',
      `packup_notifications_total ${counts.notifications || 0}`,
    ];

    return res.type('text/plain').send(`${metrics.join('\n')}\n`);
  });
});

app.get('/api/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

app.get('/api/docs', (req, res) => {
  const endpointRows = Object.entries(openApiSpec.paths)
    .flatMap(([routePath, methods]) =>
      Object.entries(methods).map(([method, details]) => {
        const tag = details.tags?.[0] || 'API';
        const summary = details.summary || '';
        return `
          <tr>
            <td><span class="method">${method.toUpperCase()}</span></td>
            <td><code>${routePath}</code></td>
            <td>${tag}</td>
            <td>${summary}</td>
          </tr>
        `;
      })
    )
    .join('');

  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PackUp API Docs</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #102026;
            background: #f8fffb;
          }
          main {
            width: min(1100px, calc(100% - 32px));
            margin: 0 auto;
            padding: 48px 0;
          }
          h1 {
            margin: 0 0 8px;
            color: #004E64;
          }
          p {
            color: #53656a;
            line-height: 1.6;
          }
          a {
            color: #004E64;
            font-weight: 700;
          }
          table {
            width: 100%;
            margin-top: 28px;
            border-collapse: collapse;
            background: #fff;
            border: 1px solid rgba(0, 78, 100, 0.14);
          }
          th,
          td {
            padding: 13px 14px;
            border-bottom: 1px solid rgba(0, 78, 100, 0.1);
            text-align: left;
            vertical-align: top;
          }
          th {
            color: #004E64;
            background: #eafff6;
          }
          code {
            color: #004E64;
            white-space: nowrap;
          }
          .method {
            display: inline-block;
            min-width: 58px;
            padding: 4px 7px;
            border-radius: 6px;
            color: #fff;
            background: #25A18E;
            font-size: 0.78rem;
            font-weight: 800;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>PackUp API Docs</h1>
          <p>
            API governance reference for PackUp. The machine-readable OpenAPI document is available at
            <a href="/api/openapi.json">/api/openapi.json</a>.
          </p>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Area</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${endpointRows}
            </tbody>
          </table>
        </main>
      </body>
    </html>
  `);
});

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
app.use('/api/notifications', require('./routes/notifications'));

// ➕ Contact form route with DB save
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  const validationErrors = validateContact({ name, email, message });

  if (validationErrors.length > 0) {
    return sendValidationError(res, validationErrors);
  }

  const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('❌ Error saving message:', err);
      return res.status(500).json({ error: 'Database error.' });
    }

    console.log('✅ Message saved with ID:', result.insertId);
    writeAuditLog({
      action: 'CONTACT_MESSAGE_SUBMITTED',
      entityType: 'contact_message',
      entityId: result.insertId,
      metadata: { email },
    });
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
