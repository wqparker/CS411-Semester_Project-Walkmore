import { useState } from 'react';
import { TopBar, BottomNav } from '../App';
import { useLocation } from '../context/LocationContext';

// RoutePlanningScreen 

export default function RoutePlanningScreen({ onNavigate }) {
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [walkingMins, setWalkingMins] = useState('');
  const [optimization, setOptimization] = useState('balanced');
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  );
  const [showDropdown, setShowDropdown] = useState(false);
  // get position from context
  const { position } = useLocation();

  const optimizationOptions = [
    {
      id: 'time',
      icon: <BoltIcon />,
      title: 'Time Saving',
      desc: 'Fastest route with minimal walking',
    },
    {
      id: 'walking',
      icon: <WalkIcon />,
      title: 'Walking Maximize',
      desc: 'Maximum walking within constraints',
    },
    {
      id: 'balanced',
      icon: <BalancedIcon />,
      title: 'Balanced',
      desc: 'Optimal mix of speed and steps',
    },
  ];

  const validate = async () => {
    const newErrors = {};
    if (!destination.trim()) {
      newErrors.destination = 'Please enter a destination';
    } else{
       try {
        const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { input: destination }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || 'Something went wrong.');
        return;
      }
      if(data.code == 1){
        newErrors.destination = 'The destination is outside service area';
      }
      if(data.code == 2){
        newErrors.destination = 'The destination does not exist'
      }

    } catch (err) {
      setApiError('Could not reach the server. Make sure the backend is running.');
    } 
    }
    if (!arrivalTime) newErrors.arrivalTime = 'Please set an arrival time';
    const mins = parseInt(walkingMins, 10);
    if (!walkingMins || isNaN(mins) || mins < 1 || mins > 120) {
      newErrors.walkingMins = 'Enter a walking time between 1 and 120 minutes';
    }
    const arrival = parseInt(arrivalTime, 10);
    if (!arrivalTime || isNaN(arrival) || arrival < 1 || arrival > 180) {
      newErrors.arrivalTime = 'Enter minutes until arrival between 1 and 180';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const saveRecentSearch = (dest) => {
    const updated = [dest, ...recentSearches.filter(s => s !== dest)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    const val = await validate();
    if (!val) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          arrivalTime,
          walkingMins,
          optimization,
          srcLat: position[0],
          srcLon: position[1],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || 'Something went wrong.');
        return;
      }

      saveRecentSearch(destination);
      onNavigate('results', { 
        route: data.route, 
        allRoutes: data.allRoutes,
        optimization, 
        destination 
      });

    } catch (err) {
      setApiError('Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationChange = async (value) => {
    setDestination(value);
    if (errors.destination) setErrors((p) => ({ ...p, destination: '' }));

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  return (
    <>
      <TopBar onAvatarClick={() => onNavigate('profile')} />

      <div className="screen-content">
        <div style={{ padding: '22px 20px 40px' }}>

          {/* Back button */}
          <button
            onClick={() => onNavigate('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--primary)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              padding: '0 0 16px 0',
            }}
          >
            <BackIcon /> Back to Map
          </button>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
            Plan Your Route
          </h1>

          {/* Destination */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Destination</label>
            <div className="input-wrapper">
              <span className="input-icon-left"><SearchIcon /></span>
              <input
                className={`form-input has-left-icon ${errors.destination ? 'input-error-border' : ''}`}
                type="text"
                placeholder="Address, name, or coordinates"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                style={errors.destination ? { borderColor: 'var(--red)' } : {}}
              />
            </div>
            {errors.destination && <p className="input-error">{errors.destination}</p>}

            {/* Dropdown */}
            {showDropdown && (suggestions.length > 0 || (destination.length === 0 && recentSearches.length > 0)) && (
            <div style={{
                  position: 'absolute',   
                  top: '100%',            
                  left: 0,                
                  right: 0,               
                  zIndex: 9999,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 4,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}>
                  {destination.length === 0 && recentSearches.length > 0 && (
                    <>
                      <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', background: 'var(--surface)' }}>
                        RECENT SEARCHES
                      </div>
                      {recentSearches.map((s, i) => (
                        <button
                          key={i}
                          onMouseDown={() => {
                            setDestination(s);
                            setSuggestions([]);
                            setShowDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            background: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                            color: 'var(--text)',
                            textAlign: 'left',
                          }}
                        >
                          🕐 {s}
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => {
                        setDestination(s);
                        setSuggestions([]);
                        setShowDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        color: 'var(--text)',
                        textAlign: 'left',
                      }}
                    >
                      📍 {s}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Arrival Time */}
          <div className="form-group">
            <label className="form-label">Minutes Until Arrival</label>
            <div className="input-wrapper">
              <span className="input-icon-left"><ClockIcon /></span>
              <input
                className="form-input has-left-icon has-right-icon"
                type="number"
                placeholder="40"
                value={arrivalTime}
                onChange={(e) => {
                  setArrivalTime(e.target.value);
                  if (errors.arrivalTime) setErrors((p) => ({ ...p, arrivalTime: '' }));
                }}
                style={errors.arrivalTime ? { borderColor: 'var(--red)' } : {}}
              />
              <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>
                min
              </span>
            </div>
            {errors.arrivalTime && <p className="input-error">{errors.arrivalTime}</p>}
          </div>

          {/* Walking Time */}
          <div className="form-group">
            <label className="form-label">Desired Walking Time</label>
            <div className="input-wrapper">
              <span className="input-icon-left"><WalkIconSm /></span>
              <input
                className="form-input has-left-icon has-right-icon"
                type="number"
                min="1"
                max="120"
                placeholder="10"
                value={walkingMins}
                onChange={(e) => {
                  setWalkingMins(e.target.value);
                  if (errors.walkingMins) setErrors((p) => ({ ...p, walkingMins: '' }));
                }}
                style={errors.walkingMins ? { borderColor: 'var(--red)' } : {}}
              />
              <span
                className="input-icon-right"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}
              >
                min
              </span>
            </div>
            {errors.walkingMins && <p className="input-error">{errors.walkingMins}</p>}
          </div>

          {/* Route Optimization */}
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label">Route Optimization</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {optimizationOptions.map((opt) => {
                const active = optimization === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setOptimization(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: active ? 'var(--primary-light)' : 'var(--bg)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: active ? 'var(--primary)' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: active ? '#fff' : 'var(--text-mid)',
                      transition: 'all 0.15s',
                    }}>
                      {opt.icon}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: active ? 'var(--primary)' : 'var(--text)',
                        marginBottom: 2,
                      }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                        {opt.desc}
                      </div>
                    </div>

                    {/* Selected badge */}
                    {active && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'var(--primary-border)',
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}>
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {apiError && <p className="input-error" style={{ marginTop: 12 }}>{apiError}</p>}

          {/* Submit */}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Finding Routes...' : 'Find Routes'}
          </button>
        

        </div>
      </div>

      <BottomNav active="map" onChange={onNavigate} />
    </>
  );
}

// Icons 

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WalkIconSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M9 20l1-5 2 2 1-2" />
      <path d="M6.2 9.4L9 8l3 2 3-2 2.8 1.4" />
      <line x1="9" y1="8" x2="8" y2="14" />
      <line x1="12" y1="10" x2="13" y2="14" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function WalkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M9 20l1-5 2 2 1-2" />
      <path d="M6.2 9.4L9 8l3 2 3-2 2.8 1.4" />
      <line x1="9" y1="8" x2="8" y2="14" />
      <line x1="12" y1="10" x2="13" y2="14" />
    </svg>
  );
}

function BalancedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}