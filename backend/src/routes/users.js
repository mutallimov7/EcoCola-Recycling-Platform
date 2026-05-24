const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 9999];

// GET /api/users/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.city_id, u.points, u.total_bottles, u.level, u.avatar_color, u.created_at,
           c.name as city_name
    FROM users u
    LEFT JOIN cities c ON c.id = u.city_id
    WHERE u.id = ?
  `).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const badges = db.prepare(`
    SELECT b.*, ub.earned_at FROM badges b
    JOIN user_badges ub ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at
  `).all(req.userId);

  const history = db.prepare(`
    SELECT re.*, m.name as machine_name, m.address as machine_address
    FROM recycling_events re
    JOIN machines m ON m.id = re.machine_id
    WHERE re.user_id = ?
    ORDER BY re.created_at DESC
    LIMIT 20
  `).all(req.userId);

  // Calculate rank
  const rank = db.prepare('SELECT COUNT(*) as c FROM users WHERE points > ?').get(user.points).c + 1;

  const currentLevel = user.level;
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || 9999;
  const prevLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const levelProgress = currentLevel >= 4 ? 100 :
    Math.min(100, Math.round(((user.points - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100));

  res.json({
    ...user,
    level_name: LEVEL_NAMES[user.level],
    level_progress: levelProgress,
    next_level_points: nextLevelThreshold,
    rank,
    badges,
    history
  });
});

// PUT /api/users/me
router.put('/me', authMiddleware, (req, res) => {
  const { name, city_id, avatar_color } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET name = ?, city_id = ?, avatar_color = ? WHERE id = ?')
    .run(name || user.name, city_id || user.city_id, avatar_color || user.avatar_color, req.userId);

  const updated = db.prepare('SELECT id, name, email, city_id, points, total_bottles, level, avatar_color FROM users WHERE id = ?').get(req.userId);
  res.json({ ...updated, level_name: LEVEL_NAMES[updated.level] });
});

module.exports = router;
