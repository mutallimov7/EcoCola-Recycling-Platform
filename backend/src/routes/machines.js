const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/machines
router.get('/', authMiddleware, (req, res) => {
  const machines = db.prepare(`
    SELECT m.*, c.name as city_name, c.lat as city_lat, c.lng as city_lng
    FROM machines m
    JOIN cities c ON c.id = m.city_id
    ORDER BY m.total_bottles DESC
  `).all();
  res.json(machines);
});

// GET /api/machines/:id
router.get('/:id', authMiddleware, (req, res) => {
  const machine = db.prepare(`
    SELECT m.*, c.name as city_name
    FROM machines m
    JOIN cities c ON c.id = m.city_id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const recentActivity = db.prepare(`
    SELECT re.created_at, re.bottles, u.name as user_name
    FROM recycling_events re
    JOIN users u ON u.id = re.user_id
    WHERE re.machine_id = ?
    ORDER BY re.created_at DESC LIMIT 10
  `).all(req.params.id);

  res.json({ ...machine, recent_activity: recentActivity });
});

// GET /api/machines/public/all (no auth needed for map embed)
router.get('/public/all', (req, res) => {
  const machines = db.prepare(`
    SELECT m.id, m.name, m.lat, m.lng, m.total_bottles, m.is_active, m.address, c.name as city_name
    FROM machines m
    JOIN cities c ON c.id = m.city_id
  `).all();
  res.json(machines);
});

// GET /api/cities
router.get('/data/cities', (req, res) => {
  const cities = db.prepare(`
    SELECT c.*, COUNT(m.id) as machine_count
    FROM cities c
    LEFT JOIN machines m ON m.city_id = c.id
    GROUP BY c.id
  `).all();
  res.json(cities);
});

module.exports = router;
