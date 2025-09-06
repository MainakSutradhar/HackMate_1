

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const ideaRoutes = require('./routes/ideas');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/ideas', ideaRoutes);

// Serve static frontend (so opening index.html/profile.html uses the same origin as API)
const staticRoot = path.resolve(__dirname, '..');
app.use(express.static(staticRoot));

// Explicit HTML routes (helps on some environments/tools where /index.html doesn't resolve via static)
app.get('/', (req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});
app.get(['/index.html', '/login.html', '/createprofile.html', '/profile.html'], (req, res) => {
  const file = req.path.replace(/^\//, '');
  res.sendFile(path.join(staticRoot, file));
});

// Health with DB status
const healthHandler = (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const db = states[mongoose.connection.readyState] || 'unknown';
  res.json({ status: 'ok', db });
};
app.get('/api/health', healthHandler);
// Common misspelling fallback
app.get('/api/helth', healthHandler);

// DB connect and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackmate';

// Start the HTTP server first so health checks work even if DB is down
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

// Connect to MongoDB (non-fatal if it fails; health route will reflect status)
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
