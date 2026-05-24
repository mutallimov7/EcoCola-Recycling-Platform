import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';
import './MapPage.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createMachineIcon = (active, isTop) => L.divIcon({
  html: `<div class="map-marker ${active ? 'active' : 'inactive'} ${isTop ? 'top' : ''}">
    <span>${isTop ? '⭐' : '♻️'}</span>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function MapPage() {
  const [machines, setMachines] = useState([]);
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const CENTER = [40.3893, 49.8671]; // Baku

  useEffect(() => {
    Promise.all([
      api.get('/machines'),
      api.get('/leaderboard/cities'),
    ]).then(([machRes, cityRes]) => {
      setMachines(machRes.data);
      setCities(cityRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const topMachines = [...machines].sort((a, b) => b.total_bottles - a.total_bottles).slice(0, 3);
  const topIds = new Set(topMachines.map(m => m.id));

  return (
    <div className="page-wrapper map-page">
      <div className="container">
        <div className="map-header fade-in">
          <h1>Recycling Map</h1>
          <p>Find Coca-Cola smart recycling machines near you</p>
        </div>

        <div className="map-layout">
          {/* Sidebar */}
          <div className="map-sidebar">
            <div className="card sidebar-card">
              <h4>🏆 Most Active Machines</h4>
              <div className="top-machines">
                {topMachines.map((m, i) => (
                  <div key={m.id} className={`top-machine ${selected?.id === m.id ? 'selected' : ''}`}
                    onClick={() => setSelected(m)}>
                    <div className="top-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div className="top-info">
                      <div className="top-name">{m.name}</div>
                      <div className="top-meta">♻️ {m.total_bottles} bottles • {m.city_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card sidebar-card">
              <h4>🏙️ City Stats</h4>
              <div className="city-stats">
                {cities.slice(0, 5).map(c => (
                  <div key={c.id} className="city-stat-row">
                    <div>
                      <div className="city-stat-name">{c.name}</div>
                      <div className="city-stat-count">{c.machine_count} machines</div>
                    </div>
                    <div className="city-bottles-count">♻️ {c.total_bottles}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card sidebar-card legend-card">
              <h4>Map Legend</h4>
              <div className="legend-items">
                <div className="legend-item"><div className="map-marker active sm"><span>♻️</span></div> Active Machine</div>
                <div className="legend-item"><div className="map-marker top sm"><span>⭐</span></div> Top 3 Machine</div>
                <div className="legend-item"><div className="map-marker inactive sm"><span>♻️</span></div> Inactive Machine</div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-container">
            {loading ? (
              <div className="map-loading"><div className="spinner"></div></div>
            ) : (
              <MapContainer
                center={CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-md)' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {machines.map(machine => (
                  <Marker
                    key={machine.id}
                    position={[machine.lat, machine.lng]}
                    icon={createMachineIcon(machine.is_active, topIds.has(machine.id))}
                    eventHandlers={{ click: () => setSelected(machine) }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <div className="popup-name">{machine.name}</div>
                        <div className="popup-city">📍 {machine.address || machine.city_name}</div>
                        <div className="popup-stats">
                          <span>♻️ {machine.total_bottles} bottles</span>
                          <span className={`popup-status ${machine.is_active ? 'active' : 'inactive'}`}>
                            {machine.is_active ? '● Active' : '● Inactive'}
                          </span>
                        </div>
                        {topIds.has(machine.id) && <div className="popup-top">⭐ Top Machine</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Selected Machine Detail */}
        {selected && (
          <div className="card selected-machine fade-in">
            <div className="selected-info">
              <div className="selected-header">
                <span className="sel-icon">{topIds.has(selected.id) ? '⭐' : '♻️'}</span>
                <div>
                  <h3>{selected.name}</h3>
                  <p>📍 {selected.address || selected.city_name}</p>
                </div>
              </div>
              <div className="selected-stats">
                <div className="sel-stat"><span>{selected.total_bottles}</span><label>Bottles</label></div>
                <div className="sel-stat"><span className={selected.is_active ? 'green' : 'red'}>{selected.is_active ? 'Active' : 'Offline'}</span><label>Status</label></div>
                <div className="sel-stat"><span>{selected.city_name}</span><label>City</label></div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>✕ Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
