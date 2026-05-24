const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'recycling.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Azerbaijan',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      total_bottles INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city_id INTEGER NOT NULL REFERENCES cities(id),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      total_bottles INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      city_id INTEGER REFERENCES cities(id),
      points INTEGER DEFAULT 0,
      total_bottles INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      avatar_color TEXT DEFAULT '#F40009',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recycling_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      machine_id INTEGER NOT NULL REFERENCES machines(id),
      bottles INTEGER DEFAULT 1,
      points_earned INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      required_bottles INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id INTEGER NOT NULL REFERENCES badges(id),
      earned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS daily_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      mission_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      reward_points INTEGER DEFAULT 50
    );
  `);

  seedData();
}

function seedData() {
  const cityCount = db.prepare('SELECT COUNT(*) as c FROM cities').get().c;
  if (cityCount > 0) return; // Already seeded

  // Seed cities
  const insertCity = db.prepare('INSERT INTO cities (name, country, lat, lng) VALUES (?, ?, ?, ?)');
  const cities = [
    ['Baku', 'Azerbaijan', 40.4093, 49.8671],
    ['Ganja', 'Azerbaijan', 40.6828, 46.3606],
    ['Sumgayit', 'Azerbaijan', 40.5897, 49.6686],
    ['Mingachevir', 'Azerbaijan', 40.7706, 47.0497],
    ['Nakhchivan', 'Azerbaijan', 39.2092, 45.4122],
  ];
  cities.forEach(c => insertCity.run(...c));

  // Seed machines for Baku (city_id=1)
  const insertMachine = db.prepare('INSERT INTO machines (name, city_id, lat, lng, address) VALUES (?, ?, ?, ?, ?)');
  const machines = [
    ['Recyclebot #1 - İçərişəhər', 1, 40.3657, 49.8370, 'İçərişəhər Metro Station, Baku'],
    ['Recyclebot #2 - Nizami', 1, 40.3787, 49.8516, 'Nizami Street, Baku'],
    ['Recyclebot #3 - 28 Mall', 1, 40.3801, 49.8491, '28 Mall Shopping Center, Baku'],
    ['Recyclebot #4 - Heydar Aliyev Center', 1, 40.3941, 49.8674, 'Heydar Aliyev Center, Baku'],
    ['Recyclebot #5 - Sahil', 1, 40.3700, 49.8420, 'Sahil Metro Station, Baku'],
    ['Recyclebot #6 - Ganjlik Mall', 1, 40.4027, 49.8742, 'Ganjlik Mall, Baku'],
    ['Recyclebot #7 - Crystal Plaza', 1, 40.4122, 49.8590, 'Crystal Plaza, Baku'],
    ['Recyclebot #8 - Port Baku', 1, 40.3638, 49.8341, 'Port Baku, Baku'],
    // Ganja (city_id=2)
    ['Recyclebot #9 - Ganja Central', 2, 40.6840, 46.3440, 'City Center, Ganja'],
    ['Recyclebot #10 - Ganja Park', 2, 40.6760, 46.3600, 'Heydar Aliyev Park, Ganja'],
    // Sumgayit (city_id=3)
    ['Recyclebot #11 - Sumgayit Center', 3, 40.5897, 49.6500, 'City Center, Sumgayit'],
    ['Recyclebot #12 - Sumgayit Park', 3, 40.5950, 49.6400, 'Sumgayit Boulevard'],
  ];
  machines.forEach(m => insertMachine.run(...m));

  // Seed badges
  const insertBadge = db.prepare('INSERT INTO badges (name, description, icon, required_bottles) VALUES (?, ?, ?, ?)');
  const badges = [
    ['First Drop', 'Recycled your first bottle!', '🌱', 1],
    ['Eco Starter', 'Recycled 10 bottles', '♻️', 10],
    ['Green Champion', 'Recycled 50 bottles', '🌿', 50],
    ['Planet Hero', 'Recycled 100 bottles', '🌍', 100],
    ['Recycling Legend', 'Recycled 500 bottles', '🏆', 500],
    ['Speed Recycler', 'Recycled 5 bottles in one day', '⚡', 0],
  ];
  badges.forEach(b => insertBadge.run(...b));

  // Seed some demo users
  const password = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, city_id, points, total_bottles, level, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const demoUsers = [
    ['Aysel Mammadova', 'aysel@demo.com', password, 1, 2450, 245, 4, '#F40009'],
    ['Tural Hasanov', 'tural@demo.com', password, 1, 1800, 180, 4, '#FF6B35'],
    ['Nigar Aliyeva', 'nigar@demo.com', password, 2, 950, 95, 3, '#00C851'],
    ['Kamran Rzayev', 'kamran@demo.com', password, 1, 750, 75, 3, '#7B2FBE'],
    ['Leyla Huseynova', 'leyla@demo.com', password, 3, 520, 52, 3, '#FF9500'],
    ['Murad Babayev', 'murad@demo.com', password, 1, 380, 38, 2, '#00B4D8'],
    ['Sevinj Quliyeva', 'sevinj@demo.com', password, 2, 210, 21, 2, '#E91E8C'],
    ['Elvin Nasirov', 'elvin@demo.com', password, 1, 150, 15, 2, '#FFC107'],
    ['Aytac Ibrahimova', 'aytac@demo.com', password, 3, 80, 8, 1, '#4CAF50'],
    ['Orhan Qasimov', 'orhan@demo.com', password, 1, 30, 3, 1, '#9E9E9E'],
  ];
  demoUsers.forEach(u => insertUser.run(...u));

  // Give demo users some badges
  const grantBadge = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)');
  // User 1 (245 bottles) gets all badges
  [1,2,3,4,5].forEach(bid => grantBadge.run(1, bid));
  // User 2 (180 bottles) gets first 4
  [1,2,3,4].forEach(bid => grantBadge.run(2, bid));
  // User 3 (95 bottles) gets first 3
  [1,2,3].forEach(bid => grantBadge.run(3, bid));
  // User 4 (75 bottles) gets first 3
  [1,2,3].forEach(bid => grantBadge.run(4, bid));
  // User 5 (52 bottles) gets first 3
  [1,2,3].forEach(bid => grantBadge.run(5, bid));
  // User 6 (38 bottles) gets first 2
  [1,2].forEach(bid => grantBadge.run(6, bid));
  // User 7 (21 bottles) gets first 2
  [1,2].forEach(bid => grantBadge.run(7, bid));
  // User 8 (15 bottles) gets first 2
  [1,2].forEach(bid => grantBadge.run(8, bid));
  // User 9 (8 bottles) gets first badge
  grantBadge.run(9, 1);
  // User 10 (3 bottles) gets first badge
  grantBadge.run(10, 1);

  // Add some recycling events for demo users
  const insertEvent = db.prepare('INSERT INTO recycling_events (user_id, machine_id, bottles, points_earned, created_at) VALUES (?, ?, ?, ?, ?)');
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    insertEvent.run(1, 1, 1, 10, d.toISOString());
    insertEvent.run(2, 2, 1, 10, d.toISOString());
    insertEvent.run(3, 9, 1, 10, d.toISOString());
  }

  // Update machine bottle counts
  db.exec(`UPDATE machines SET total_bottles = (SELECT COALESCE(SUM(bottles), 0) FROM recycling_events WHERE machine_id = machines.id)`);
  // Update city bottle counts
  db.exec(`UPDATE cities SET total_bottles = (SELECT COALESCE(SUM(total_bottles), 0) FROM machines WHERE city_id = cities.id)`);
}

module.exports = { db, initDB };
