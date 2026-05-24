import React, { useEffect, useState } from 'react';
import api from '../api';
import './MissionsPage.css';

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/missions').then(r => setMissions(r.data)).finally(() => setLoading(false));
  }, []);

  const completed = missions.filter(m => m.completed).length;
  const total = missions.length;
  const totalReward = missions.filter(m => m.completed).reduce((s, m) => s + m.reward_points, 0);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper missions-page">
      <div className="container">
        <div className="missions-header fade-in">
          <h1>Daily Missions</h1>
          <p>Complete missions to earn bonus points and rewards — resets every day!</p>
        </div>

        {/* Progress Summary */}
        <div className="card missions-summary fade-in">
          <div className="summary-stat">
            <span className="sum-icon">🎯</span>
            <div>
              <div className="sum-val">{completed}/{total}</div>
              <div className="sum-lbl">Missions Done</div>
            </div>
          </div>
          <div className="sum-progress-wrap">
            <div className="sum-progress-track">
              <div className="sum-progress-fill" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}></div>
            </div>
            <div className="sum-progress-label">{total > 0 ? Math.round((completed / total) * 100) : 0}%</div>
          </div>
          <div className="summary-stat">
            <span className="sum-icon">⚡</span>
            <div>
              <div className="sum-val">{totalReward}</div>
              <div className="sum-lbl">Bonus Points Earned</div>
            </div>
          </div>
        </div>

        {/* Mission Cards */}
        <div className="missions-grid fade-in">
          {missions.map(mission => {
            const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
            const missionIcon = mission.mission_type === 'recycle_daily' ? '♻️'
              : mission.mission_type === 'recycle_streak' ? '⚡'
              : '🎯';
            return (
              <div key={mission.id} className={`mission-card card ${mission.completed ? 'completed' : ''}`}>
                <div className="mission-card-top">
                  <div className="mission-card-icon">{missionIcon}</div>
                  <div className="mission-card-info">
                    <h3>{mission.title}</h3>
                    <p>{mission.description}</p>
                  </div>
                  <div className="mission-card-reward">
                    <span className="badge-pill gold">+{mission.reward_points} pts</span>
                  </div>
                </div>

                <div className="mission-card-progress">
                  <div className="mc-progress-bar">
                    <div
                      className="mc-progress-fill"
                      style={{ width: `${pct}%`, background: mission.completed ? 'var(--eco-green)' : 'var(--coke-red)' }}
                    ></div>
                  </div>
                  <div className="mc-progress-nums">
                    <span>{mission.progress} / {mission.target}</span>
                    <span className="mc-pct">{pct}%</span>
                  </div>
                </div>

                {mission.completed && (
                  <div className="mission-complete-badge">
                    <span>✓ Mission Complete!</span>
                    <span className="badge-pill green">+{mission.reward_points} pts claimed</span>
                  </div>
                )}
              </div>
            );
          })}

          {missions.length === 0 && (
            <div className="missions-empty">
              <span style={{ fontSize: 48 }}>🎯</span>
              <h3>No missions for today yet</h3>
              <p>Try logging in or recycling a bottle to trigger today's missions!</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card missions-tips fade-in">
          <h3>💡 How Missions Work</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-icon">🔄</span>
              <div>
                <strong>Daily Reset</strong>
                <p>Missions reset every day at midnight. New challenges await!</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⚡</span>
              <div>
                <strong>Bonus Points</strong>
                <p>Complete missions to earn bonus points on top of your recycling points.</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🏆</span>
              <div>
                <strong>Stack Rewards</strong>
                <p>Complete all missions for maximum daily points and badge progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
