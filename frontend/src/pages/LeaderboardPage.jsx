import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './LeaderboardPage.css';

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Eco Hero', 3: 'Green Master', 4: 'Planet Saver' };
const TABS = [
  { key: 'global', label: '🌍 Global', endpoint: '/leaderboard/global' },
  { key: 'weekly', label: '📅 Weekly', endpoint: '/leaderboard/weekly' },
  { key: 'monthly', label: '🗓️ Monthly', endpoint: '/leaderboard/monthly' },
  { key: 'cities', label: '🏙️ Cities', endpoint: '/leaderboard/cities' },
];

const rankColor = (rank) => {
  if (rank === 1) return 'var(--gold)';
  if (rank === 2) return 'var(--silver)';
  if (rank === 3) return 'var(--bronze)';
  return 'var(--text-muted)';
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(1);

  useEffect(() => {
    api.get('/leaderboard/cities').then(r => setCities(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const tab = TABS.find(t => t.key === activeTab);
    const endpoint = activeTab === 'city' ? `/leaderboard/city/${selectedCity}` : tab?.endpoint;
    api.get(endpoint).then(r => setData(r.data)).catch(() => setData([])).finally(() => setLoading(false));
  }, [activeTab, selectedCity]);

  const allTabs = [
    ...TABS,
    { key: 'city', label: '🏘️ My City', endpoint: `/leaderboard/city/${selectedCity}` },
  ];

  return (
    <div className="page-wrapper lb-page">
      <div className="container">
        <div className="lb-header fade-in">
          <h1>Leaderboard</h1>
          <p>Compete with eco-warriors worldwide and in your city</p>
        </div>

        {/* Tabs */}
        <div className="lb-tabs card">
          {allTabs.map(t => (
            <button
              key={t.key}
              className={`lb-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* City selector for Cities tab */}
        {activeTab === 'cities' && (
          <div className="cities-grid fade-in">
            {cities.map((city, i) => (
              <div key={city.id} className="city-card card">
                <div className="city-rank" style={{ color: rankColor(city.rank) }}>
                  {city.rank === 1 ? '🥇' : city.rank === 2 ? '🥈' : city.rank === 3 ? '🥉' : `#${city.rank}`}
                </div>
                <div className="city-info">
                  <div className="city-name">{city.name}</div>
                  <div className="city-meta">{city.user_count} users • {city.machine_count} machines</div>
                </div>
                <div className="city-bottles">
                  <span>♻️ {city.total_bottles}</span>
                  <span className="city-pts">{city.total_points?.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Leaderboard */}
        {activeTab !== 'cities' && (
          <div className="lb-table fade-in">
            {loading ? (
              <div className="lb-loading"><div className="spinner"></div></div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {data.length >= 3 && (
                  <div className="podium">
                    {[1, 0, 2].map(idx => {
                      const entry = data[idx];
                      if (!entry) return null;
                      const sizes = [70, 80, 70];
                      return (
                        <div key={entry.id} className={`podium-item pos-${idx + 1} ${entry.is_current_user ? 'is-me' : ''}`}>
                          <div
                            className="podium-avatar"
                            style={{
                              width: sizes[idx], height: sizes[idx],
                              background: entry.avatar_color,
                              fontSize: sizes[idx] * 0.4,
                              boxShadow: entry.is_current_user ? '0 0 20px rgba(244,0,9,0.5)' : `0 0 20px ${rankColorRaw(idx + 1)}44`
                            }}
                          >
                            {entry.name?.charAt(0)}
                          </div>
                          <div className="podium-name">{entry.name?.split(' ')[0]}</div>
                          <div className="podium-pts" style={{ color: rankColor(idx + 1) }}>
                            {entry.points?.toLocaleString()} pts
                          </div>
                          <div className="podium-medal">
                            {idx === 1 ? '🥇' : idx === 0 ? '🥈' : '🥉'}
                          </div>
                          <div className="podium-base" style={{ height: [80, 100, 60][idx], background: `${rankColorRaw(idx + 1)}22`, borderColor: `${rankColorRaw(idx + 1)}44` }}></div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table */}
                <div className="lb-rows">
                  {data.map(entry => (
                    <div key={entry.id} className={`lb-row card ${entry.is_current_user ? 'is-me' : ''}`}>
                      <div className="lb-rank" style={{ color: rankColor(entry.rank) }}>
                        {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </div>
                      <div
                        className="lb-avatar"
                        style={{ background: entry.avatar_color || '#F40009' }}
                      >
                        {entry.name?.charAt(0)}
                      </div>
                      <div className="lb-info">
                        <div className="lb-name">
                          {entry.name}
                          {entry.is_current_user && <span className="badge-pill red" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 8 }}>YOU</span>}
                        </div>
                        <div className="lb-meta">
                          <span className="badge-pill green" style={{ fontSize: 11 }}>{entry.level_name || LEVEL_NAMES[entry.level]}</span>
                          {entry.city_name && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>📍 {entry.city_name}</span>}
                        </div>
                      </div>
                      <div className="lb-stats">
                        <div className="lb-pts">{entry.points?.toLocaleString()} <span>pts</span></div>
                        <div className="lb-bottles">♻️ {entry.total_bottles}</div>
                      </div>
                    </div>
                  ))}
                  {data.length === 0 && (
                    <div className="lb-empty">No data yet. Be the first to recycle! 🌱</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function rankColorRaw(rank) {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#4A5A6A';
}
