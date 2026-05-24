import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './DashboardPage.css';

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const LEVEL_NEXT = { 1: 100, 2: 500, 3: 1500, 4: 9999 };
const LEVEL_PREV = { 1: 0, 2: 100, 3: 500, 4: 1500 };
const LEVEL_COLORS = { 1: '#8899AA', 2: '#00C851', 3: '#00B4D8', 4: '#FFD700' };
const LEVEL_ICONS = { 1: '🌱', 2: '♻️', 3: '🌿', 4: '🌍' };

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/me'),
      api.get('/missions')
    ]).then(([profileRes, missionsRes]) => {
      setProfile(profileRes.data);
      setMissions(missionsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!profile) return null;

  const levelColor = LEVEL_COLORS[profile.level] || '#8899AA';
  const prevThreshold = LEVEL_PREV[profile.level] || 0;
  const nextThreshold = LEVEL_NEXT[profile.level] || 9999;
  const progressPct = profile.level >= 4 ? 100 :
    Math.min(100, Math.round(((profile.points - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

  const todayBottles = profile.history?.filter(h => {
    const today = new Date().toISOString().slice(0, 10);
    return h.created_at?.slice(0, 10) === today;
  }).length || 0;

  return (
    <div className="page-wrapper dashboard-page">
      <div className="container">
        {/* Welcome Header */}
        <div className="dash-header fade-in">
          <div>
            <p className="dash-greeting">Good {getTimeOfDay()}, 👋</p>
            <h1 className="dash-name">{profile.name}</h1>
            <div className="dash-level" style={{ color: levelColor }}>
              <span>{LEVEL_ICONS[profile.level]}</span>
              <span>{LEVEL_NAMES[profile.level]}</span>
            </div>
          </div>
          <Link to="/recycle" className="btn btn-green recycle-btn-dash">
            <span>♻️</span>
            <span>Drop a Bottle</span>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="stats-grid fade-in">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(244,0,9,0.1)', color: 'var(--coke-red)' }}>⚡</div>
            <div>
              <div className="stat-value">{profile.points.toLocaleString()}</div>
              <div className="stat-label">Total Points</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(0,200,81,0.1)', color: 'var(--eco-green)' }}>♻️</div>
            <div>
              <div className="stat-value">{profile.total_bottles.toLocaleString()}</div>
              <div className="stat-label">Bottles Recycled</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>🏆</div>
            <div>
              <div className="stat-value">#{profile.rank}</div>
              <div className="stat-label">Global Rank</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(0,180,216,0.1)', color: '#00B4D8' }}>📅</div>
            <div>
              <div className="stat-value">{todayBottles}</div>
              <div className="stat-label">Today's Bottles</div>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          {/* Level Progress */}
          <div className="card dash-card level-card">
            <div className="level-header">
              <div>
                <h3>Level Progress</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {profile.level < 4
                    ? `${nextThreshold - profile.points} pts to ${LEVEL_NAMES[Math.min(4, profile.level + 1)]}`
                    : 'Max level reached! 🎉'}
                </p>
              </div>
              <div className="level-badge-big" style={{ color: levelColor, borderColor: `${levelColor}44` }}>
                <span>{LEVEL_ICONS[profile.level]}</span>
                <span>{LEVEL_NAMES[profile.level]}</span>
              </div>
            </div>
            <div className="level-bar-wrap">
              <div className="level-bar-track">
                <div
                  className="level-bar-fill"
                  style={{ width: `${progressPct}%`, background: levelColor, boxShadow: `0 0 12px ${levelColor}88` }}
                ></div>
              </div>
              <span className="level-pct">{progressPct}%</span>
            </div>
            <div className="level-bar-labels">
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{prevThreshold} pts</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{profile.level < 4 ? `${nextThreshold} pts` : 'MAX'}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="card dash-card badges-card">
            <div className="card-header">
              <h3>Badges</h3>
              <Link to="/profile" className="view-all">View All →</Link>
            </div>
            <div className="badges-row">
              {profile.badges?.slice(0, 5).map(badge => (
                <div key={badge.id} className="badge-item" title={badge.name}>
                  <div className="badge-emoji">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                </div>
              ))}
              {(profile.badges?.length || 0) === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Recycle your first bottle to earn badges! 🌱
                </p>
              )}
            </div>
          </div>

          {/* Daily Missions */}
          <div className="card dash-card missions-card">
            <div className="card-header">
              <h3>Daily Missions</h3>
              <Link to="/missions" className="view-all">View All →</Link>
            </div>
            <div className="missions-list">
              {missions.slice(0, 3).map(m => {
                const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
                return (
                  <div key={m.id} className={`mission-row ${m.completed ? 'done' : ''}`}>
                    <div className="mission-info">
                      <span className="mission-title">{m.title}</span>
                      <span className="mission-desc">{m.description}</span>
                    </div>
                    <div className="mission-right">
                      {m.completed
                        ? <span className="badge-pill green">✓ Done</span>
                        : <span className="mission-progress">{m.progress}/{m.target}</span>
                      }
                      <div className="mission-bar-track">
                        <div className="mission-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent History */}
          <div className="card dash-card history-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <Link to="/profile" className="view-all">View All →</Link>
            </div>
            <div className="history-list">
              {profile.history?.slice(0, 5).map((h, i) => (
                <div key={i} className="history-row">
                  <div className="history-icon">♻️</div>
                  <div className="history-info">
                    <span className="history-machine">{h.machine_name}</span>
                    <span className="history-time">{timeAgo(h.created_at)}</span>
                  </div>
                  <span className="history-pts">+{h.points_earned} pts</span>
                </div>
              ))}
              {(profile.history?.length || 0) === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                  No recycling history yet. Drop your first bottle! 🍃
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
