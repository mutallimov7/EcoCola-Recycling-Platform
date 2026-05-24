import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  { icon: '♻️', title: 'Smart Recycling', desc: 'Drop your plastic bottles in Coca-Cola smart machines and instantly earn eco-points.' },
  { icon: '🏆', title: 'Compete & Win', desc: 'Rise up the global and city rankings. Compete weekly and monthly for top spots.' },
  { icon: '🎯', title: 'Daily Missions', desc: 'Complete daily challenges to earn bonus points and exclusive achievements.' },
  { icon: '🗺️', title: 'Eco Map', desc: 'Find the nearest recycling machines on an interactive map of your city.' },
  { icon: '🎖️', title: 'Earn Badges', desc: 'Unlock exclusive badges as you hit recycling milestones — from Eco Starter to Legend.' },
  { icon: '🌍', title: 'City Rankings', desc: 'See how your city performs against others and be the green champion of your town.' },
];

const levels = [
  { name: 'Beginner', icon: '🌱', points: '0 pts', color: '#8899AA' },
  { name: 'Eco Hero', icon: '♻️', points: '100 pts', color: '#00C851' },
  { name: 'Green Master', icon: '🌿', points: '500 pts', color: '#00B4D8' },
  { name: 'Planet Saver', icon: '🌍', points: '1500 pts', color: '#FFD700' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1"></div>
          <div className="hero-orb orb-2"></div>
          <div className="hero-orb orb-3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge badge-pill green">
            🌱 Powered by Coca-Cola
          </div>
          <h1 className="hero-title">
            Recycle. Earn.<br />
            <span className="gradient-text-red">Save the Planet.</span>
          </h1>
          <p className="hero-subtitle">
            Turn every empty bottle into points, badges, and rankings. Join thousands of eco-warriors making a difference.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary hero-cta">
              <span>Start Recycling</span>
              <span>→</span>
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num gradient-text-green">50K+</span>
              <span className="stat-label">Bottles Recycled</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-num gradient-text-red">12K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-num gradient-text-green">5</span>
              <span className="stat-label">Cities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features section">
        <div className="container">
          <div className="section-header">
            <span className="badge-pill blue">Features</span>
            <h2>Everything you need to go green</h2>
            <p>A complete gamification ecosystem designed to make recycling fun and rewarding.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="levels section">
        <div className="container">
          <div className="section-header">
            <span className="badge-pill gold">Progression</span>
            <h2>Level Up Your Impact</h2>
            <p>Earn points with every bottle you recycle and climb through eco-ranks.</p>
          </div>
          <div className="levels-track">
            {levels.map((level, i) => (
              <div key={i} className="level-item">
                <div className="level-icon-wrap" style={{ borderColor: level.color, boxShadow: `0 0 20px ${level.color}44` }}>
                  <span className="level-icon">{level.icon}</span>
                </div>
                <div className="level-name" style={{ color: level.color }}>{level.name}</div>
                <div className="level-pts">{level.points}</div>
                {i < levels.length - 1 && <div className="level-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-card card">
            <div className="cta-orb"></div>
            <span style={{ fontSize: 56 }}>🌍</span>
            <h2>Ready to make a difference?</h2>
            <p>Join the recycling revolution. Every bottle counts.</p>
            <Link to="/signup" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-logo">
            <span>♻️</span>
            <span>Eco<span style={{ color: 'var(--coke-red)' }}>Cola</span></span>
          </div>
          <p className="footer-copy">© 2024 Coca-Cola Recycling Initiative. Every bottle matters.</p>
        </div>
      </footer>
    </div>
  );
}
