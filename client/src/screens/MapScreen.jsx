import React, { useEffect, useState, useRef, Fragment, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TopBar, BottomNav } from '../App';
import { useLocation } from '../context/LocationContext';

// file is getting large, **MARKED FOR REFACTORING**

// Fix Leaflet's default marker icon broken by bundlers 
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom "You" marker icon 
const youIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(37,99,235,0.15);
      border: 3px solid #2563EB;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 8px rgba(37,99,235,0.08);
    ">
      <div style="
        width: 13px; height: 13px;
        border-radius: 50%;
        background: #2563EB;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Demo-mode marker - orange to visually distinguish from real GPS
const demoIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(234,88,12,0.15);
      border: 3px solid #EA580C;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 8px rgba(234,88,12,0.08);
    ">
      <div style="
        width: 13px; height: 13px;
        border-radius: 50%;
        background: #EA580C;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Recenter helper (keeps map in sync if position changes) 
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position]);
  return null;
}

function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDirections(route, transitStops) {
  if (!route?.path || !route?.coords) return [];
  const { path, coords } = route;
  const dirs = [];

  for (let i = 0; i < path.length - 1; i++) {
    const toName = path[i + 1];
    const toCoord = coords[i + 1];

    if (i === 1 && transitStops.length > 0) {
      const seg = transitStops[0];
      dirs.push({
        type: 'transit',
        instruction: `Board ${seg.lineName}`,
        subtext: `${seg.departureStop} → ${seg.arrivalStop} · ${seg.stopCount} stop${seg.stopCount !== 1 ? 's' : ''}`,
        icon: seg.vehicleType === 'SUBWAY' ? '🚇' : '🚌',
        targetCoord: toCoord,
      });
    } else {
      dirs.push({
        type: 'walk',
        instruction: i === path.length - 2 ? 'Walk to your destination' : `Walk to ${toName}`,
        subtext: toName,
        icon: '🚶',
        targetCoord: toCoord,
      });
    }
  }

  dirs.push({
    type: 'arrive',
    instruction: 'You have arrived!',
    subtext: path[path.length - 1],
    icon: '🎯',
    targetCoord: null,
  });

  return dirs;
}

// Demo Panel 
// Floating overlay for manually setting location during demos/presentations.
 
const NYC_PRESETS = [
  { label: 'Empire State',  lat: 40.7484,  lon: -73.9857 },
  { label: 'Times Square',  lat: 40.7580,  lon: -73.9855 },
  { label: 'Grand Central', lat: 40.7527,  lon: -73.9772 },
  { label: 'Union Square',  lat: 40.7359,  lon: -73.9906 },
  { label: 'Penn Station',  lat: 40.7506,  lon: -73.9971 },
  { label: 'Brooklyn Br.',  lat: 40.7061,  lon: -73.9969 },
];
 
function DemoPanel({ routeCoords, directions, currentStepIndex }) {
  const { position, demoMode, setMockPosition, clearMockPosition } = useLocation();
  const [open, setOpen]    = useState(false);
  const [latInput, setLat] = useState('');
  const [lonInput, setLon] = useState('');
  const [inputErr, setInputErr] = useState('');

  const handleTeleport = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || lat < -90 || lat > 90) { setInputErr('Invalid latitude'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { setInputErr('Invalid longitude'); return; }
    setInputErr('');
    setMockPosition(lat, lon);
  };

  const handlePreset = (preset) => {
    setLat(String(preset.lat));
    setLon(String(preset.lon));
    setMockPosition(preset.lat, preset.lon);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1200,
      pointerEvents: 'none',
    }}>

      {/* Panel - full width, sits above buttons */}
      {open && (
        <div style={{
          pointerEvents: 'all',
          margin: '0 0 8px 0',
          background: 'var(--bg)',
          border: `2px solid ${demoMode ? '#EA580C' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.12)',
          padding: '12px 16px',
          minHeight: 'calc(30vh - 110px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>

          {/* Row 1: coords + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-mid)', flex: 1 }}>
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </span>
            {demoMode ? (
              <button
                onClick={() => { clearMockPosition(); setLat(''); setLon(''); }}
                style={{
                  fontSize: 11, fontWeight: 600, color: '#EA580C',
                  background: '#FFF7ED', border: '1px solid #FDBA74',
                  borderRadius: 20, padding: '2px 10px',
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                Use Real GPS
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>Dev Mode</span>
            )}
          </div>
          
          {/* show route next waypoint for easy location moving along route */}
          {routeCoords?.length > 0 && directions[currentStepIndex]?.targetCoord && (
            <div style={{ 
              padding: '8px 10px', 
              background: 'var(--surface)', 
              borderRadius: 6, 
              marginBottom: 10,
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--text-mid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Next waypoint: </span>
                {directions[currentStepIndex].targetCoord[0].toFixed(5)}, {directions[currentStepIndex].targetCoord[1].toFixed(5)}
              </div>
              <button
                onClick={() => {
                  const [lat, lon] = directions[currentStepIndex].targetCoord;
                  setMockPosition(lat, lon);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: 'none',
                  background: '#EA580C',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Jump →
              </button>
            </div>
          )}

          {/* Row 2: presets - scrollable */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>            {NYC_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                style={{
                  fontSize: 12, padding: '5px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 20, background: 'var(--surface)',
                  color: 'var(--text)', cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Row 3: manual lat/lon + go */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="number" step="any" placeholder="Latitude"
              value={latInput}
              onChange={e => { setLat(e.target.value); setInputErr(''); }}
              style={{
                flex: 1, padding: '7px 8px',
                border: '1px solid var(--border)', borderRadius: 6,
                fontFamily: 'inherit', fontSize: 12,
                background: 'var(--bg)', color: 'var(--text)',
              }}
            />
            <input
              type="number" step="any" placeholder="Longitude"
              value={lonInput}
              onChange={e => { setLon(e.target.value); setInputErr(''); }}
              style={{
                flex: 1, padding: '7px 8px',
                border: '1px solid var(--border)', borderRadius: 6,
                fontFamily: 'inherit', fontSize: 12,
                background: 'var(--bg)', color: 'var(--text)',
              }}
            />
            <button
              onClick={handleTeleport}
              style={{
                padding: '7px 14px',
                background: '#EA580C', color: '#fff',
                border: 'none', borderRadius: 6,
                fontFamily: 'inherit', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Go
            </button>
          </div>
          {inputErr && <p style={{ fontSize: 11, color: 'var(--red)', margin: '6px 0 0' }}>{inputErr}</p>}
        </div>
      )}

      {/* </> toggle button - bottom left, circular */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 0 16px 16px', pointerEvents: 'all' }}>        <button
          onClick={() => setOpen(o => !o)}
          title="Developer tools"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `2px solid ${demoMode ? '#EA580C' : 'var(--border)'}`,
            background: demoMode ? '#FFF7ED' : 'var(--bg)',
            color: demoMode ? '#EA580C' : 'var(--text-mid)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &lt;/&gt;
        </button>
      </div>

    </div>
  );
}

// MapScreen 
export default function MapScreen({ onNavigate, onAvatarClick, routeData }) {
  // Mock user position being replaced now
  const { position, rawPosition, accuracy, error, loading, demoMode, permissionState, requestLocation, setMockPosition, devModeEnabled } = useLocation();
  const mapRef = useRef(null);
  const geoJson = routeData?.routeData;
  const routeObj = routeData?.route;
  const transitStops = geoJson?.properties?.fullTransitInfo || [];

  const [navActive, setNavActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const directions = useMemo(
    () => buildDirections(routeObj, transitStops),
    [routeObj, transitStops]
  );

  const polylineCoords = geoJson?.geometry?.coordinates || [];

  const handleRecenter = () => {
    console.log('mapRef:', mapRef.current);
    if (mapRef.current) mapRef.current.setView(position, 14);
  };

  // fit whole route in map view, overview
  const handleFitRoute = () => {
    console.log('handleFitRoute called, mapRef:', mapRef.current);
    console.log('geoJson:', geoJson);
    if (mapRef.current && geoJson) {
      const layer = L.geoJSON(geoJson);
      console.log('bounds:', layer.getBounds());
      mapRef.current.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
  };

  // Start navigation when route data arrives
  useEffect(() => {
    if (geoJson && routeObj) {
      setNavActive(true);
      setCurrentStepIndex(0);
    } else {
      setNavActive(false);
    }
  }, [geoJson, routeObj]);

  // Proximity detection — advance step when close enough to target
  useEffect(() => {

    // debug console print
    console.log('Position updated:', position[0], position[1]);

    if (!navActive || !directions.length) return;
    const step = directions[currentStepIndex];
    if (!step?.targetCoord) return;

    const [targetLat, targetLon] = step.targetCoord;
    const dist = haversineDistance(position[0], position[1], targetLat, targetLon);

    if (dist < 40) {
      setCurrentStepIndex(i => Math.min(i + 1, directions.length - 1));
    }
  }, [position]);

  // end the trip and clear
  const handleEndTrip = () => {
    onNavigate('map', null);
  };

  //fit the map to route size
  function FitRouteBounds({ data }) {
    const map = useMap();
    useEffect(() => {
      if (data) {
        const layer = L.geoJSON(data);
        map.fitBounds(layer.getBounds(), { padding: [50, 50] });
      }
    }, [data, map]);
    return null;
  }
  return (
    <>
      <TopBar onAvatarClick={onAvatarClick} />

      <div className="screen-content" style={{ position: 'relative' }}>

        {/* wrap in navActive to hide in navigation */}
        {/* Search bar (tapping navigates to Route Planning) */}
        {!navActive && ( 
          <div style={{ padding: '12px 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
            <button
              onClick={() => onNavigate('route')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <PinIcon />
              <span style={{ fontSize: 14, color: 'var(--text-light)' }}>Where to?</span>
            </button>
          </div>
        )}

        {/* navigation HUD */}
        {navActive && directions[currentStepIndex] && (() => {
          const step = directions[currentStepIndex];
          const isArrived = step.type === 'arrive';
          return (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0, right: 0,
              zIndex: 1200,
              pointerEvents: 'none',
              background: isArrived ? '#10B981' : 'var(--bg)',
              borderBottom: `1px solid ${isArrived ? '#10B981' : 'var(--border)'}`,
              padding: '14px 16px 20px',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
            }}>
              <div style={{ pointerEvents: 'all' }}>
                {/* Step instruction */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 32 }}>{step.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isArrived ? '#fff' : 'var(--text)' }}>
                      {step.instruction}
                    </div>
                    <div style={{ fontSize: 12, color: isArrived ? 'rgba(255,255,255,0.8)' : 'var(--text-mid)', marginTop: 2 }}>
                      {step.subtext}
                    </div>
                  </div>
                </div>
                {/* Progress + end button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: isArrived ? 'rgba(255,255,255,0.8)' : 'var(--text-mid)' }}>
                    Step {currentStepIndex + 1} of {directions.length}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isArrived && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFitRoute();
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: isArrived ? 'none' : '2px solid var(--red, #ef4444)',
                          background: isArrived ? 'rgba(255,255,255,0.2)' : 'none',
                          color: isArrived ? '#fff' : 'var(--red, #ef4444)',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⊙ Overview
                      </button>
                    )}
                    <button 
                      onClick={handleEndTrip}
                      style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: isArrived ? 'none' : '2px solid var(--red, #ef4444)',
                          background: isArrived ? 'rgba(255,255,255,0.2)' : 'none',
                          color: isArrived ? '#fff' : 'var(--red, #ef4444)',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                      }}
                    >
                      {isArrived ? 'Done' : '■ End Trip'}
                    </button>
                  </div>
                
                </div>
              </div>  
            </div>
          );
        })()}

        {/* Status banner - shown for GPS error or while acquiring */}
        {(error || (loading && !demoMode)) && (
          <div style={{
            position: 'absolute',
            top: 68,
            left: 12, right: 12,
            zIndex: 1100,
            background: error ? '#FEF2F2' : '#EFF6FF',
            border: `1px solid ${error ? '#FECACA' : '#BFDBFE'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: error ? '#991B1B' : '#1E40AF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <span style={{ fontSize: 14 }}>{error ? '⚠️' : '📡'}</span>
            <span>{error ?? 'Acquiring GPS signal…'}</span>
          </div>
        )}

        {/* Location pre-prompt — shown before user has granted permission */}
        {permissionState === 'idle' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1050,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
            gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              📍
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: 0 }}>
              Enable Your Location
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              WalkMore uses your location to show where you are on the map and guide you during navigation.
            </p>
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={requestLocation}
            >
              Enable Location
            </button>
            <button
              onClick={() => setMockPosition(40.7484, -73.9857)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-mid)', fontSize: 13, fontFamily: 'inherit',
              }}
            >
              Skip — use Demo Mode instead
            </button>
          </div>
        )}

        {/* Leaflet Map */}
        <MapContainer
          center={position}
          zoom={14}
          style={{ height: 'calc(100vh - 130px)', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap position={position} />
          <MapController mapRef={mapRef} />
          <Marker position={position} icon={demoMode ? demoIcon : youIcon}>
            <Popup>
              {demoMode
                ? `Demo position\n${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
                : `You are here${accuracy ? `\n±${Math.round(accuracy)}m` : ''}`}
            </Popup>
          </Marker>
        {/* Drawing the navigation path */}
        {navActive && geoJson && (
            <>
              <GeoJSON 
                data={geoJson} 
                style={{ color: '#2563EB', weight: 6, opacity: 0.8 }} 
              />
              <FitRouteBounds data={geoJson} />
            </>
          )}
        {/* Identify transit stops */}
        {navActive && transitStops.map((segment, idx) => (
          <React.Fragment key={idx}>
            {/* Departure */}
            <Marker 
              position={[segment.deplat, segment.deplon]} 
              icon={stopIcon}
            >
              <Popup>
                <div style={{ fontSize: '13px' }}>
                <strong style={{ color: '#000000' }}>{segment.lineName} </strong><br/>
                <b>Departure:</b> {segment.departureStop}<br/>
                </div>
              </Popup>
            </Marker>

            {/* Arrival */}
            <Marker 
              position={[segment.arrlat, segment.arrlon]} 
              icon={stopIcon}
            >
              <Popup>
                <div style={{ fontSize: '13px' }}>
                <strong style={{ color: '#000000' }}>{segment.lineName} </strong><br/>
                <b>Arrival:</b> {segment.arrivalStop}<br/>
                <small>{segment.stopCount} stops</small>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
        </MapContainer>

        {/* Demo Panel */}
        {permissionState !== 'idle' && devModeEnabled && (
          <DemoPanel 
            routeCoords={polylineCoords}
            directions={directions}
            currentStepIndex={currentStepIndex}
          />
        )}

        {/* Recenter FAB */}
        <button
          onClick={handleRecenter}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1300,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Re-center map"
        >
          <RecenterIcon />
        </button>

      </div>

      <BottomNav active="map" onChange={onNavigate} />
    </>
  );
}

// Local Icons

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function NavigateIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function RecenterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
const stopIcon = L.divIcon({
  className: '', 
  html: `
    <div style="
      width: 14px; 
      height: 14px;
      border-radius: 50%;
      background-color: #EF4444; 
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [14, 14], 
  iconAnchor: [7, 7],
});