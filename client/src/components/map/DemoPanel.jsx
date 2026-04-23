import { useState } from 'react';
import { useLocation } from '../../context/LocationContext';

const NYC_PRESETS = [
  { label: 'Empire State', lat: 40.7484, lon: -73.9857 },
  { label: 'Times Square', lat: 40.7580, lon: -73.9855 },
  { label: 'Grand Central', lat: 40.7527, lon: -73.9772 },
  { label: 'Union Square', lat: 40.7359, lon: -73.9906 },
  { label: 'Penn Station', lat: 40.7506, lon: -73.9971 },
  { label: 'Brooklyn Br.', lat: 40.7061, lon: -73.9969 },
];

export default function DemoPanel({ directions, currentStepIndex }) {
  const { position, demoMode, setMockPosition, clearMockPosition } = useLocation();
  const [open, setOpen] = useState(false);
  const [latInput, setLat] = useState('');
  const [lonInput, setLon] = useState('');
  const [inputErr, setInputErr] = useState('');

  const handleTeleport = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || lat < -90  || lat > 90)  { setInputErr('Invalid latitude');  return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { setInputErr('Invalid longitude'); return; }
    setInputErr('');
    setMockPosition(lat, lon);
  };

  const handlePreset = (preset) => {
    setLat(String(preset.lat));
    setLon(String(preset.lon));
    setMockPosition(preset.lat, preset.lon);
  };

  const nextWaypoint = directions[currentStepIndex]?.targetCoord;

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1200, pointerEvents: 'none' }}>

      {open && (
        <div style={{
          pointerEvents: 'all', margin: '0 0 8px 0', background: 'var(--bg)',
          border: `2px solid ${demoMode ? '#EA580C' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', boxShadow: '0 -2px 20px rgba(0,0,0,0.12)',
          padding: '12px 16px', minHeight: 'calc(30vh - 110px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>

          {/* Current coords + GPS toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-mid)', flex: 1 }}>
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </span>
            {demoMode ? (
              <button
                onClick={() => { clearMockPosition(); setLat(''); setLon(''); }}
                style={{
                  fontSize: 11, fontWeight: 600, color: '#EA580C', background: '#FFF7ED',
                  border: '1px solid #FDBA74', borderRadius: 20, padding: '2px 10px',
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>
                Use Real GPS
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>Dev Mode</span>
            )}
          </div>

          {/* Next waypoint jump */}
          {nextWaypoint && (
            <div style={{
              padding: '8px 10px', background: 'var(--surface)', borderRadius: 6,
              marginBottom: 10, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Next waypoint: </span>
                {nextWaypoint[0].toFixed(5)}, {nextWaypoint[1].toFixed(5)}
              </div>
              <button
                onClick={() => setMockPosition(nextWaypoint[0], nextWaypoint[1])}
                style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none',
                  background: '#EA580C', color: '#fff', fontFamily: 'inherit',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                Jump →
              </button>
            </div>
          )}

          {/* Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {NYC_PRESETS.map(p => (
              <button key={p.label} onClick={() => handlePreset(p)}
                style={{
                  fontSize: 12, padding: '5px 10px', border: '1px solid var(--border)',
                  borderRadius: 20, background: 'var(--surface)', color: 'var(--text)',
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual lat/lon */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input type="number" step="any" placeholder="Latitude" value={latInput}
              onChange={e => { setLat(e.target.value); setInputErr(''); }}
              style={{
                flex: 1, padding: '7px 8px', border: '1px solid var(--border)',
                borderRadius: 6, fontFamily: 'inherit', fontSize: 12,
                background: 'var(--bg)', color: 'var(--text)',
              }} />
            <input type="number" step="any" placeholder="Longitude" value={lonInput}
              onChange={e => { setLon(e.target.value); setInputErr(''); }}
              style={{
                flex: 1, padding: '7px 8px', border: '1px solid var(--border)',
                borderRadius: 6, fontFamily: 'inherit', fontSize: 12,
                background: 'var(--bg)', color: 'var(--text)',
              }} />
            <button onClick={handleTeleport}
              style={{
                padding: '7px 14px', background: '#EA580C', color: '#fff',
                border: 'none', borderRadius: 6, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Go
            </button>
          </div>
          {inputErr && <p style={{ fontSize: 11, color: 'var(--red)', margin: '6px 0 0' }}>{inputErr}</p>}

        </div>
      )}

      {/* Toggle button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 0 16px 16px', pointerEvents: 'all' }}>
        <button onClick={() => setOpen(o => !o)} title="Developer tools"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2px solid ${demoMode ? '#EA580C' : 'var(--border)'}`,
            background: demoMode ? '#FFF7ED' : 'var(--bg)',
            color: demoMode ? '#EA580C' : 'var(--text-mid)',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          &lt;/&gt;
        </button>
      </div>

    </div>
  );
}