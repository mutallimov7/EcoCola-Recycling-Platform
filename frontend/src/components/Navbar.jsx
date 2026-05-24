import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/recycle', label: 'Recycle', icon: '♻️' },
    { to: '/leaderboard', label: 'Rankings', icon: '🏆' },
    { to: '/map', label: 'Map', icon: '🗺️' },
    { to: '/missions', label: 'Missions', icon: '🎯' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user ? '/dashboard' : '/'} className="navbar-logo">
          <span className="logo-icon">♻️</span>
          <span className="logo-text">Eco<span className="logo-red">Cola</span></span>
        </Link>

        {user && (
          <>
            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="navbar-right">
              <div className="nav-points">
                <span className="points-icon">⚡</span>
                <span className="points-value">{user.points?.toLocaleString()}</span>
              </div>
              <Link to="/profile" className="nav-avatar" style={{ backgroundColor: user.avatar_color || '#F40009' }}>
                {user.name?.charAt(0).toUpperCase()}
              </Link>
              <button className="btn btn-ghost nav-logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
              <span></span><span></span><span></span>
            </button>
          </>
        )}

        {!user && (
          <div className="navbar-right">
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
