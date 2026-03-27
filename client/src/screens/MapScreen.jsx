import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TopBar, BottomNav } from '../App';

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

// Recenter helper (keeps map in sync if position changes) 
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position]);
  return null;
}

// MapScreen 
export default function MapScreen({ onNavigate }) {
  // Mock user position — will be replaced with real GPS later
  const userPosition = [40.7484, -73.9857]; // Empire State Building

  return (
    <>
      <TopBar onAvatarClick={() => onNavigate('account')} />

      <div className="screen-content" style={{ position: 'relative' }}>

        {/* Search bar (tapping navigates to Route Planning) */}
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

        {/* Leaflet Map */}
        <MapContainer
          center={userPosition}
          zoom={14}
          style={{ height: 'calc(100vh - 130px)', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap position={userPosition} />
          <Marker position={userPosition} icon={youIcon}>
            <Popup>You are here</Popup>
          </Marker>
        </MapContainer>

        {/* Route FAB */}
        <button
          onClick={() => onNavigate('route')}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            width: 52,
            height: 52,
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
          aria-label="Plan route"
        >
          <NavigateIcon />
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