import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './AuthPages.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', city_id: '1' });
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch cities (public endpoint)
    fetch('http://localhost:3001/api/machines/data/cities')
      .then(r => r.json())
      .then(data => setCities(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, parseInt(form.city_id));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>
      <div className="auth-card card fade-in">
        <div className="auth-brand">
          <span className="auth-brand-icon">♻️</span>
          <span className="auth-brand-name">Eco<span>Cola</span></span>
        </div>
        <h1 className="auth-title">Join the movement</h1>
        <p className="auth-subtitle">Create your account and start earning eco-points today</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <select
              className="form-input"
              value={form.city_id}
              onChange={e => setForm({ ...form, city_id: e.target.value })}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
            >
              {cities.length > 0 ? cities.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#0E1520' }}>{c.name}</option>
              )) : (
                <>
                  <option value="1" style={{ background: '#0E1520' }}>Baku</option>
                  <option value="2" style={{ background: '#0E1520' }}>Ganja</option>
                  <option value="3" style={{ background: '#0E1520' }}>Sumgayit</option>
                </>
              )}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
