const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function getLevel(points) {
  if (points >= 1500) return 4;
  if (points >= 500) return 3;
  if (points >= 100) return 2;
  return 1;
}

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 9999];
const AVATAR_COLORS = ['#F40009', '#FF6B35', '#00C851', '#7B2FBE', '#FF9500', '#00B4D8', '#E91E8C', '#FFC107'];

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password, city_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = bcrypt.hashSync(password, 10);
  const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, city_id, avatar_color) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, password_hash, city_id || 1, avatar_color);

  const userId = result.lastInsertRowid;
  const user = db.prepare('SELECT id, name, email, city_id, points, total_bottles, level, avatar_color, created_at FROM users WHERE id = ?').get(userId);

  // Create today's daily missions for new user
  createDailyMissions(userId);

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    token,
    user: { ...user, level_name: LEVEL_NAMES[user.level] }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Ensure daily missions exist
  createDailyMissions(user.id);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...userSafe } = user;
  res.json({ token, user: { ...userSafe, level_name: LEVEL_NAMES[user.level] } });
});

function createDailyMissions(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id FROM daily_missions WHERE user_id = ? AND date = ?').get(userId, today);
  if (existing) return;

  const missions = [
    { type: 'recycle_daily', title: 'Daily Recycler', description: 'Recycle 3 bottles today', target: 3, reward: 30 },
    { type: 'recycle_streak', title: 'Quick Drop', description: 'Recycle 5 bottles in one session', target: 5, reward: 50 },
    { type: 'points_daily', title: 'Point Collector', description: 'Earn 50 points today', target: 50, reward: 25 },
  ];

  const insert = db.prepare(
    'INSERT INTO daily_missions (user_id, mission_type, title, description, target, date, reward_points) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  missions.forEach(m => insert.run(userId, m.type, m.title, m.description, m.target, today, m.reward));
}

module.exports = router;
