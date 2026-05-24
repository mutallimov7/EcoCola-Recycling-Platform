import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './ProfilePage.css';

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const LEVEL_COLORS = { 1: '#8899AA', 2: '#00C851', 3: '#00B4D8', 4: '#FFD700' };
const ALL_BADGE_ICONS = { 1: '🌱', 2: '♻️', 3: '🌿', 4: '🌍', 5: '🏆', 6: '⚡' };

const AVATAR_COLORS = ['#F40009', '#FF6B35', '#00C851', '#7B2FBE', '#FF9500', '#00B4D8', '#E91E8C', '#FFC107', '#4CAF50'];
const LEVEL_PREV = { 1: 0, 2: 100, 3: 500, 4: 1500 };
const LEVEL_NEXT = { 1: 100, 2: 500, 3: 1500, 4: 9999 };

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar_color: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users/me'),
    ]).then(async ([profileRes]) => {
      setProfile(profileRes.data);
      setEditForm({ name: profileRes.data.name, avatar_color: profileRes.data.avatar_color });

      // Get all badges
      const all = [
        { id: 1, name: 'First Drop', description: 'Recycled your first bottle!', icon: '🌱', required_bottles: 1 },
        { id: 2, name: 'Eco Starter', description: 'Recycled 10 bottles', icon: '♻️', required_bottles: 10 },
        { id: 3, name: 'Green Champion', description: 'Recycled 50 bottles', icon: '🌿', required_bottles: 50 },
        { id: 4, name: 'Planet Hero', description: 'Recycled 100 bottles', icon: '🌍', required_bottles: 100 },
        { id: 5, name: 'Recycling Legend', description: 'Recycled 500 bottles', icon: '🏆', required_bottles: 500 },
      ];
      setAllBadges(all);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', { name: editForm.name, avatar_color: editForm.avatar_color });
      setProfile(prev => ({ ...prev, name: res.data.name, avatar_color: res.data.avatar_color }));
      setUser(prev => ({ ...prev, name: res.data.name, avatar_color: res.data.avatar_color }));
      setSaveMsg('Saved! ✓');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('Error saving'); }
    setSaving(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!profile) return null;

  const earnedIds = new Set(profile.badges?.map(b => b.id));
  const levelColor = LEVEL_COLORS[profile.level] || '#8899AA';
  const prevThreshold = LEVEL_PREV[profile.level] || 0;
  const nextThreshold = LEVEL_NEXT[profile.level] || 9999;
  const progressPct = profile.level >= 4 ? 100 :
    Math.min(100, Math.round(((profile.points - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page-wrapper profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-hero fade-in">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" style={{ background: profile.avatar_color }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-level-badge" style={{ background: levelColor }}>
              {profile.level}
            </div>
          </div>
          <div className="profile-info">
            {!editing ? (
              <>
                <h1 className="profile-name">{profile.name}</h1>
                <div className="profile-meta">
                  <span className="badge-pill green">{LEVEL_NAMES[profile.level]}</span>
                  {profile.city_name && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>📍 {profile.city_name}</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Joined {joinDate}</span>
                </div>
                <button className="btn btn-ghost edit-btn" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              </>
            ) : (
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    className="form-input"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    style={{ maxWidth: 300 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Avatar Color</label>
                  <div className="color-picker">
                    {AVATAR_COLORS.map(c => (
                      <button
                        key={c}
                        className={`color-swatch ${editForm.avatar_color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setEditForm(p => ({ ...p, avatar_color: c }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="edit-actions">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  {saveMsg && <span className="save-msg">{saveMsg}</span>}
                </div>
              </div>
            )}
          </div>
          <div className="profile-rank-badge">
            <div className="rank-num">#{profile.rank}</div>
            <div className="rank-label">Global Rank</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats fade-in">
          <div className="card prfile-stat-card">
            <div className="prstat-icon" style={{ color: 'var(--coke-red)' }}>⚡</div>
            <div className="prstat-val">{profile.points.toLocaleString()}</div>
            <div className="prstat-lbl">Total Points</div>
          </div>
          <div className="card prfile-stat-card">
            <div className="prstat-icon" style={{ color: 'var(--eco-green)' }}>♻️</div>
            <div className="prstat-val">{profile.total_bottles.toLocaleString()}</div>
            <div className="prstat-lbl">Bottles Recycled</div>
          </div>
          <div className="card prfile-stat-card">
            <div className="prstat-icon" style={{ color: '#FFD700' }}>🏅</div>
            <div className="prstat-val">{profile.badges?.length || 0}</div>
            <div className="prstat-lbl">Badges Earned</div>
          </div>
          <div className="card prfile-stat-card">
            <div className="prstat-icon" style={{ color: '#00B4D8' }}>📅</div>
            <div className="prstat-val">{profile.history?.length || 0}</div>
            <div className="prstat-lbl">Sessions</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="card profile-level-card fade-in">
          <div className="lv-header">
            <h3>Level Progress</h3>
            <div className="lv-badge" style={{ color: levelColor, borderColor: `${levelColor}44` }}>
              {LEVEL_NAMES[profile.level]}
            </div>
          </div>
          <div className="lv-bar-wrap">
            <div className="lv-bar-track">
              <div className="lv-bar-fill" style={{ width: `${progressPct}%`, background: levelColor, boxShadow: `0 0 10px ${levelColor}88` }}></div>
            </div>
            <span className="lv-pct">{progressPct}%</span>
          </div>
          <div className="lv-labels">
            <span>{prevThreshold.toLocaleString()} pts</span>
            <span>{profile.level < 4 ? `${nextThreshold.toLocaleString()} pts to ${LEVEL_NAMES[profile.level + 1]}` : 'Max Level! 🎉'}</span>
          </div>
        </div>

        {/* All Badges */}
        <div className="card profile-badges fade-in">
          <h3>Badge Collection</h3>
          <p className="badge-sub">{earnedIds.size} / {allBadges.length} badges earned</p>
          <div className="all-badges-grid">
            {allBadges.map(badge => {
              const earned = earnedIds.has(badge.id);
              const pct = Math.min(100, Math.round((profile.total_bottles / badge.required_bottles) * 100));
              return (
                <div key={badge.id} className={`badge-big-card ${earned ? 'earned' : 'locked'}`}>
                  <div className="badge-big-icon">{earned ? badge.icon : '🔒'}</div>
                  <div className="badge-big-name">{badge.name}</div>
                  <div className="badge-big-desc">{badge.description}</div>
                  {!earned && badge.required_bottles > 0 && (
                    <div className="badge-progress-wrap">
                      <div className="badge-progress-bar">
                        <div className="badge-progress-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="badge-progress-pct">{pct}%</span>
                    </div>
                  )}
                  {earned && <span className="badge-pill green" style={{ fontSize: 11, marginTop: 4 }}>Earned ✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="card profile-history fade-in">
          <h3>Recycling History</h3>
          <div className="history-table">
            <div className="ht-header">
              <span>Machine</span>
              <span>City</span>
              <span>Points</span>
              <span>Date</span>
            </div>
            {profile.history?.map((h, i) => (
              <div key={i} className="ht-row">
                <span>{h.machine_name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{h.city_name}</span>
                <span className="ht-pts">+{h.points_earned}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(profile.history?.length || 0) === 0 && (
              <div className="history-empty">No recycling history yet. Drop your first bottle! 🍾</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
