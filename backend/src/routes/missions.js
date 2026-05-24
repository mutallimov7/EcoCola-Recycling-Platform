const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/missions
router.get('/', authMiddleware, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  // Create missions if not existing
  let missions = db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date = ?').all(req.userId, today);

  if (missions.length === 0) {
    const templates = [
      { type: 'recycle_daily', title: 'Daily Recycler', description: 'Recycle 3 bottles today', target: 3, reward: 30 },
      { type: 'recycle_streak', title: 'Quick Drop', description: 'Recycle 5 bottles in one session', target: 5, reward: 50 },
      { type: 'points_daily', title: 'Point Collector', description: 'Earn 50 points today', target: 50, reward: 25 },
    ];
    const insert = db.prepare(
      'INSERT INTO daily_missions (user_id, mission_type, title, description, target, date, reward_points) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    templates.forEach(m => insert.run(req.userId, m.type, m.title, m.description, m.target, today, m.reward));
    missions = db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date = ?').all(req.userId, today);
  }

  res.json(missions);
});

module.exports = router;
