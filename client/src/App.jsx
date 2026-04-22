import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { useLocation } from './context/LocationContext';
import './App.css';

import MapScreen from './screens/MapScreen';
import RoutePlanningScreen from './screens/RoutePlanningScreen';
import AccountScreen from './screens/AccountScreen';
import ProgressScreen from './screens/ProgressScreen';
import RouteResultsScreen from './screens/RouteResultsScreen';
import LandingScreen from './screens/LandingScreen';
import ProfileScreen from './screens/ProfileScreen';

// Shared Icons

export function MapIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

export function ProgressIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// Shared TopBar 

export function TopBar({ onAvatarClick }) {
  const { demoMode } = useLocation();
  return (
    <div className="top-bar">
      <div className="logo">
        <div className="logo-icon">✓</div>
        WalkMore
      </div>
      {demoMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: '#EA580C',
          background: '#FFF7ED',
          border: '1px solid #FDBA74',
          borderRadius: 20,
          padding: '3px 10px',
          whiteSpace: 'nowrap',
        }}>
          🟠 Demo
        </div>
      )}
      <button className="avatar-btn" onClick={onAvatarClick} aria-label="Account">
        <UserIcon />
      </button>
    </div>
  );
}

// Shared BottomNav 

export function BottomNav({ active, onChange }) {
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${active === 'map' ? 'active' : ''}`}
        onClick={() => onChange('map')}
      >
        <MapIcon />
        Map
      </button>
      <button
        className={`nav-item ${active === 'progress' ? 'active' : ''}`}
        onClick={() => onChange('progress')}
      >
        <ProgressIcon />
        Progress
      </button>
    </div>
  );
}

// App Root

function AppContent() {
  const { user } = useAuth();
  const [screen, setScreen] = useState('landing');
  const [routeData, setRouteData] = useState(null);

  const navigate = (destination, data = null) => {
    setRouteData(data); // changing to always cleaning data
    setScreen(destination);
  };

  const handleAvatarClick = () => {
    if (user) {
      navigate('profile');
    } else {
      navigate('account');
    }
  };

  return (
    <div className="app-shell">
      {screen === 'landing'  && <LandingScreen onNavigate={navigate} />}
      {screen === 'map'      && <MapScreen onNavigate={navigate} onAvatarClick={handleAvatarClick} routeData={routeData}/>}
      {screen === 'route'    && <RoutePlanningScreen onNavigate={navigate} />}
      {screen === 'account'  && <AccountScreen onNavigate={navigate} />}
      {screen === 'profile'  && <ProfileScreen onNavigate={navigate} />}
      {screen === 'progress' && <ProgressScreen onNavigate={navigate} />}
      {screen === 'results'  && <RouteResultsScreen onNavigate={navigate} routeData={routeData} />}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}