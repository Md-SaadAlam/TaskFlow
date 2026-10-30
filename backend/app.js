// Builds the Express app (middleware + routes). server.js starts it.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const ApiError = require('./utils/ApiError');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Render (and most hosts) sit behind a proxy. This lets rate limiting see the real client IP.
app.set('trust proxy', 1);

// Adds safe default HTTP headers.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: only the frontend URL(s) listed in CLIENT_URL may call this API from a browser.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, '')) // remove trailing slashes
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin header (curl, Postman, server-to-server) are allowed.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, 'This origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' })); // small limit blocks oversized bodies

// Simple health checks (handy to test the deployment in a browser).
app.get('/', (req, res) => {
  res.json({ success: true, message: 'TaskFlow API is running. Try /api/health' });
});
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    status: dbConnected ? 'ok' : 'database not connected',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
