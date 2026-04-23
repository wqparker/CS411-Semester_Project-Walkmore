import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { TopBar, BottomNav } from '../App';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigationSession } from '../hooks/useNavigationSession';
import { saveTrip } from '../services/tripService';

import { RecenterMap, MapController, FitRouteBounds } from '../components/map/MapHelpers';
import { UserMarker, TransitStopMarkers } from '../components/map/MapMarkers';
import NavigationHUD from '../components/map/NavigationHUD';
import DemoPanel from '../components/map/DemoPanel';

export default function MapScreen({ onNavigate, onAvatarClick, routeData }) {
  const { position, accuracy, error, loading, demoMode,
          permissionState, requestLocation, setMockPosition, devModeEnabled } = useLocation();
  const { token, user } = useAuth();
  const mapRef = useRef(null);

  const geoJson = routeData?.routeData;
  const routeObj = routeData?.route;
  const transitStops = geoJson?.properties?.fullTransitInfo || [];

  const session = useNavigationSession(position);

  useEffect(() => {
    if (geoJson && routeObj) {
      session.startSession(routeObj, transitStops);
    } else {
      session.endSession();
    }
  }, [geoJson, routeObj]);

  const handleRecenter = () => {
    if (mapRef.current) mapRef.current.setView(position, 14);
  };

  const handleFitRoute = () => {
    if (mapRef.current && geoJson)
      mapRef.current.fitBounds(L.geoJSON(geoJson).getBounds(), { padding: [50, 50] });
  };

  const handleEndTrip = async () => {
    try {
      await saveTrip(token, {
        routeObj,
        cumulativeDist: session.cumulativeDistRef.current,
        user,
        optimization: routeData?.optimization,
        startTime: session.startTimeRef.current,
        directions: session.directions,
        currentStepIndex: session.currentStepIndex,
      });
    } catch (err) {
      console.error('Failed to save trip:', err);
    }
    session.endSession();
    onNavigate('map', null);
  };

  const { navActive, directions, currentStepIndex } = session;

  return (
    <>
      <div style={{ pointerEvents: permissionState === 'idle' ? 'none' : 'all' }}>
        <TopBar onAvatarClick={onAvatarClick} />
      </div>
        
      <div className="screen-content" style={{ position: 'relative' }}>

        {/* Search bar */}
        {!navActive && (
          <div style={{ padding: '12px 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
            <button
              onClick={() => onNavigate('route')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)', background: 'var(--bg)',
                cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <PinIcon />
              <span style={{ fontSize: 14, color: 'var(--text-light)' }}>Where to?</span>
            </button>
          </div>
        )}

        {/* Navigation HUD */}
        {navActive && (
          <NavigationHUD
            directions={directions}
            currentStepIndex={currentStepIndex}
            onEndTrip={handleEndTrip}
            onFitRoute={handleFitRoute}
          />
        )}

        {/* GPS status banner */}
        {(error || (loading && !demoMode)) && (
          <div style={{
            position: 'absolute', top: 68, left: 12, right: 12, zIndex: 1100,
            background: error ? '#FEF2F2' : '#EFF6FF',
            border: `1px solid ${error ? '#FECACA' : '#BFDBFE'}`,
            borderRadius: 'var(--radius-md)', padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: error ? '#991B1B' : '#1E40AF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <span style={{ fontSize: 14 }}>{error ? '⚠️' : '📡'}</span>
            <span>{error ?? 'Acquiring GPS signal…'}</span>
          </div>
        )}

        {/* Location permission card */}
        {permissionState === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1050, background: 'var(--bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '0 32px', gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              📍
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: 0 }}>
              Enable Your Location
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              WalkMore uses your location to show where you are on the map and guide you during navigation.
            </p>
            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={requestLocation}>
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
          <UserMarker position={position} demoMode={demoMode} accuracy={accuracy} />

          {navActive && geoJson && (
            <>
              <GeoJSON data={geoJson} style={{ color: '#2563EB', weight: 6, opacity: 0.8 }} />
              <FitRouteBounds data={geoJson} />
            </>
          )}

          {navActive && <TransitStopMarkers transitStops={transitStops} />}
        </MapContainer>

        {/* Demo Panel */}
        {permissionState !== 'idle' && devModeEnabled && (
          <DemoPanel directions={directions} currentStepIndex={currentStepIndex} />
        )}

        {/* Recenter FAB */}
        <div style={{ pointerEvents: permissionState === 'idle' ? 'none' : 'all' }}>
          <button
            onClick={handleRecenter}
            aria-label="Re-center map"
            style={{
              position: 'absolute', bottom: 16, right: 16, zIndex: 1300,
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RecenterIcon />
          </button>
        </div>

      </div>

      <div style={{ pointerEvents: permissionState === 'idle' ? 'none' : 'all' }}>
        <BottomNav active="map" onChange={onNavigate} />
      </div>
    </>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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