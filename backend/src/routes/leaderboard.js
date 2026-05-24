const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };

function formatLeaderboard(rows, currentUserId) {
  return rows.map((row, i) => ({
    rank: i + 1,
    id: row.id,
    name: row.name,
    points: row.points,
    total_bottles: row.total_bottles,
    level: row.level,
    level_name: LEVEL_NAMES[row.level],
    avatar_color: row.avatar_color,
    city_name: row.city_name,
    is_current_user: row.id === currentUserId
  }));
}

// GET /api/leaderboard/global
router.get('/global', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.points, u.total_bottles, u.level, u.avatar_color, c.name as city_name
    FROM users u LEFT JOIN cities c ON c.id = u.city_id
    ORDER BY u.points DESC LIMIT 50
  `).all();
  res.json(formatLeaderboard(rows, req.userId));
});

// GET /api/leaderboard/city/:cityId
router.get('/city/:cityId', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.points, u.total_bottles, u.level, u.avatar_color, c.name as city_name
    FROM users u LEFT JOIN cities c ON c.id = u.city_id
    WHERE u.city_id = ?
    ORDER BY u.points DESC LIMIT 50
  `).all(req.params.cityId);
  res.json(formatLeaderboard(rows, req.userId));
});

// GET /api/leaderboard/weekly
router.get('/weekly', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, SUM(re.points_earned) as points, SUM(re.bottles) as total_bottles,
           u.level, u.avatar_color, c.name as city_name
    FROM recycling_events re
    JOIN users u ON u.id = re.user_id
    LEFT JOIN cities c ON c.id = u.city_id
    WHERE re.created_at >= datetime('now', '-7 days')
    GROUP BY u.id
    ORDER BY points DESC LIMIT 50
  `).all();
  res.json(formatLeaderboard(rows, req.userId));
});

// GET /api/leaderboard/monthly
router.get('/monthly', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, SUM(re.points_earned) as points, SUM(re.bottles) as total_bottles,
           u.level, u.avatar_color, c.name as city_name
    FROM recycling_events re
    JOIN users u ON u.id = re.user_id
    LEFT JOIN cities c ON c.id = u.city_id
    WHERE re.created_at >= datetime('now', '-30 days')
    GROUP BY u.id
    ORDER BY points DESC LIMIT 50
  `).all();
  res.json(formatLeaderboard(rows, req.userId));
});

// GET /api/leaderboard/cities
router.get('/cities', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.total_bottles,
           COUNT(DISTINCT u.id) as user_count,
           COALESCE(SUM(u.points), 0) as total_points
    FROM cities c
    LEFT JOIN users u ON u.city_id = c.id
    GROUP BY c.id
    ORDER BY c.total_bottles DESC
  `).all();
  res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
});

module.exports = router;
