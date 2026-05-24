require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/db');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const recyclingRoutes = require('./src/routes/recycling');
const leaderboardRoutes = require('./src/routes/leaderboard');
const machineRoutes = require('./src/routes/machines');
const missionRoutes = require('./src/routes/missions');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recycle', recyclingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/missions', missionRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🍃 Recycling API running on http://localhost:${PORT}`);
});

module.exports = app;
