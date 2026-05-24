const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 9999];
const POINTS_PER_BOTTLE = 10;

function getLevel(points) {
  if (points >= 1500) return 4;
  if (points >= 500) return 3;
  if (points >= 100) return 2;
  return 1;
}

function checkAndAwardBadges(userId, totalBottles) {
  const badges = db.prepare('SELECT * FROM badges WHERE required_bottles > 0 ORDER BY required_bottles').all();
  const newBadges = [];
  for (const badge of badges) {
    if (totalBottles >= badge.required_bottles) {
      const existing = db.prepare('SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badge.id);
      if (!existing) {
        db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
        newBadges.push(badge);
      }
    }
  }
  return newBadges;
}

function updateMissionProgress(userId, bottlesRecycled, pointsEarned) {
  const today = new Date().toISOString().slice(0, 10);
  const missions = db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date = ? AND completed = 0').all(userId, today);

  for (const mission of missions) {
    let newProgress = mission.progress;
    if (mission.mission_type === 'recycle_daily' || mission.mission_type === 'recycle_streak') {
      newProgress += bottlesRecycled;
    } else if (mission.mission_type === 'points_daily') {
      newProgress += pointsEarned;
    }

    const completed = newProgress >= mission.target ? 1 : 0;
    db.prepare('UPDATE daily_missions SET progress = ?, completed = ? WHERE id = ?')
      .run(Math.min(newProgress, mission.target), completed, mission.id);

    // Award bonus points for completing mission
    if (completed && !mission.completed) {
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(mission.reward_points, userId);
    }
  }
}

// POST /api/recycle
router.post('/', authMiddleware, (req, res) => {
  const { machine_id } = req.body;
  if (!machine_id) return res.status(400).json({ error: 'machine_id required' });

  const machine = db.prepare('SELECT * FROM machines WHERE id = ? AND is_active = 1').get(machine_id);
  if (!machine) return res.status(404).json({ error: 'Machine not found or inactive' });

  const bottles = 1;
  const points = POINTS_PER_BOTTLE;

  // Insert event
  db.prepare('INSERT INTO recycling_events (user_id, machine_id, bottles, points_earned) VALUES (?, ?, ?, ?)')
    .run(req.userId, machine_id, bottles, points);

  // Update user points, bottles, level
  db.prepare('UPDATE users SET points = points + ?, total_bottles = total_bottles + ? WHERE id = ?')
    .run(points, bottles, req.userId);

  // Update machine
  db.prepare('UPDATE machines SET total_bottles = total_bottles + ? WHERE id = ?').run(bottles, machine_id);
  // Update city
  db.prepare('UPDATE cities SET total_bottles = total_bottles + ? WHERE id = (SELECT city_id FROM machines WHERE id = ?)')
    .run(bottles, machine_id);

  // Recalculate level
  const user = db.prepare('SELECT points, total_bottles, level FROM users WHERE id = ?').get(req.userId);
  const newLevel = getLevel(user.points);
  const leveledUp = newLevel !== user.level;
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, req.userId);

  // Check badges
  const newBadges = checkAndAwardBadges(req.userId, user.total_bottles);

  // Update daily missions
  updateMissionProgress(req.userId, bottles, points);

  const updatedUser = db.prepare('SELECT id, name, points, total_bottles, level FROM users WHERE id = ?').get(req.userId);

  res.json({
    success: true,
    points_earned: points,
    total_points: updatedUser.points,
    total_bottles: updatedUser.total_bottles,
    level: updatedUser.level,
    level_name: LEVEL_NAMES[updatedUser.level],
    leveled_up: leveledUp,
    new_badges: newBadges,
    machine_name: machine.name
  });
});

// GET /api/recycle/history
router.get('/history', authMiddleware, (req, res) => {
  const history = db.prepare(`
    SELECT re.*, m.name as machine_name, m.address, c.name as city_name
    FROM recycling_events re
    JOIN machines m ON m.id = re.machine_id
    JOIN cities c ON c.id = m.city_id
    WHERE re.user_id = ?
    ORDER BY re.created_at DESC
    LIMIT 50
  `).all(req.userId);
  res.json(history);
});

module.exports = router;
