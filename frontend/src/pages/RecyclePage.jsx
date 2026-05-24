import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './RecyclePage.css';

const POINTS_PER_BOTTLE = 10;

export default function RecyclePage() {
  const { user, refreshUser } = useAuth();
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionBottles, setSessionBottles] = useState(0);

  useEffect(() => {
    api.get('/machines').then(res => {
      setMachines(res.data);
      if (res.data.length > 0) setSelectedMachine(res.data[0]);
    });
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDrop = async () => {
    if (!selectedMachine || dropping) return;
    setDropping(true);
    setResult(null);

    try {
      const res = await api.post('/recycle', { machine_id: selectedMachine.id });
      setResult(res.data);
      setSessionBottles(prev => prev + 1);
      await refreshUser();

      if (res.data.leveled_up) {
        showToast(`🎉 Level Up! You are now ${res.data.level_name}!`, 'success');
      } else if (res.data.new_badges?.length > 0) {
        showToast(`🏅 New badge: ${res.data.new_badges[0].name}!`, 'success');
      } else {
        showToast(`+${res.data.points_earned} points earned! 🌿`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Error recycling. Try again.', 'error');
    } finally {
      setTimeout(() => setDropping(false), 1500);
    }
  };

  return (
    <div className="page-wrapper recycle-page">
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="container">
        <div className="recycle-header fade-in">
          <h1>Drop a Bottle</h1>
          <p>Select a nearby recycling machine and drop your plastic bottle to earn points</p>
        </div>

        <div className="recycle-layout">
          {/* Machine Selector */}
          <div className="card machine-selector">
            <h3>Select Machine</h3>
            <div className="machine-list">
              {machines.slice(0, 8).map(m => (
                <button
                  key={m.id}
                  className={`machine-option ${selectedMachine?.id === m.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMachine(m)}
                >
                  <div className="machine-opt-icon">🤖</div>
                  <div className="machine-opt-info">
                    <div className="machine-opt-name">{m.name}</div>
                    <div className="machine-opt-city">{m.city_name} • {m.total_bottles} bottles</div>
                  </div>
                  {selectedMachine?.id === m.id && <span className="machine-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Main Machine UI */}
          <div className="machine-main">
            <div className="machine-ui card">
              {/* Machine Viewport */}
              <div className="machine-viewport">
                <div className="machine-screen">
                  <div className="machine-screen-top">
                    <div className="coca-cola-logo">♻️ RECYCLEBOT</div>
                    {selectedMachine && (
                      <div className="machine-screen-name">{selectedMachine.name}</div>
                    )}
                  </div>

                  {/* Bottle Drop Zone */}
                  <div className={`machine-chute ${dropping ? 'animating' : ''}`}>
                    <div className={`bottle-icon ${dropping ? 'falling' : ''}`}>🍾</div>
                    <div className="chute-slot">
                      <div className="slot-inner"></div>
                    </div>
                  </div>

                  {/* Points Display */}
                  <div className="machine-display">
                    {result && !dropping ? (
                      <div className="points-flash scale-in">
                        <span className="plus-pts">+{result.points_earned}</span>
                        <span className="pts-label">POINTS</span>
                        <span className="total-pts">{result.total_points.toLocaleString()} total</span>
                      </div>
                    ) : (
                      <div className="idle-display">
                        <div className="pts-per-bottle">
                          <span className="pts-per-n">{POINTS_PER_BOTTLE}</span>
                          <span className="pts-per-u">pts / bottle</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drop Button */}
                <button
                  className={`drop-btn ${dropping ? 'dropping' : ''}`}
                  onClick={handleDrop}
                  disabled={dropping || !selectedMachine}
                >
                  {dropping ? (
                    <div className="drop-loading">
                      <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span className="drop-icon">♻️</span>
                      <span>DROP BOTTLE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Session Stats */}
              <div className="session-stats">
                <div className="session-stat">
                  <span className="sess-val">{sessionBottles}</span>
                  <span className="sess-label">This Session</span>
                </div>
                <div className="sess-divider"></div>
                <div className="session-stat">
                  <span className="sess-val">{user?.total_bottles || 0}</span>
                  <span className="sess-label">Total Bottles</span>
                </div>
                <div className="sess-divider"></div>
                <div className="session-stat">
                  <span className="sess-val">{user?.points?.toLocaleString() || 0}</span>
                  <span className="sess-label">Total Points</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="recycle-tips card">
              <h4>♻️ How it works</h4>
              <ul>
                <li>Select the nearest recycling machine</li>
                <li>Insert your plastic bottle into the machine</li>
                <li>Click "DROP BOTTLE" to register your recycle</li>
                <li>Earn <strong>{POINTS_PER_BOTTLE} points</strong> instantly</li>
                <li>Collect badges and climb the leaderboard!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
