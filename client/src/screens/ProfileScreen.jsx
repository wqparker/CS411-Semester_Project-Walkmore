import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { TopBar, BottomNav } from '../App';
import { useLocation } from '../context/LocationContext';

export default function ProfileScreen({ onNavigate }) {
    const { user, token, logout } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const { devModeEnabled, toggleDevMode } = useLocation();
    const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]  = useState(false);

    const handleSignOut = () => {
      logout();
      onNavigate('landing');
    };

    const formatDate = (dob) => {
      if (!dob) return 'N/A';
      const date = new Date(dob + 'T00:00:00');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatHeight = (height_cm, units) => {
      if (!height_cm) return 'N/A';
      if (units === 'imperial') {
        const totalInches = Math.round(height_cm / 2.54);
        const ft = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        return `${ft}ft ${inches}in`;
      }
      return `${Math.round(height_cm)}cm`;
    };

    const formatWeight = (weight, units) => {
      if (!weight) return 'N/A';
      return units === 'imperial' ? `${weight}lbs` : `${weight}kg`;
    };


    const handleDeleteAccount = async () => {
      try {
        const res = await fetch('/api/auth/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          alert('Failed to delete account. Please try again.');
          return;
        }

        logout();
        onNavigate('landing');
      } catch {
        alert('Something went wrong. Please try again.');
      }
    };
    return (
      <>
        <TopBar onAvatarClick={() => {}} />
        <div className="screen-content">
          <div style={{ padding: '22px 20px 48px' }}>

            {/* Back */}
            <button
              onClick={() => onNavigate('map')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', padding: '0 0 16px 0',
              }}
            >
              <BackIcon /> Back
            </button>
          
            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              {user?.picture && !imgError ? (
                <>
                  {/* Fallback initial shown while image loads */}
                  {!imgLoaded && (
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'var(--primary)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, color: '#fff', fontWeight: 700,
                    }}>
                      {user?.name?.[0] ?? '?'}
                    </div>
                  )}
                  <img
                    src={user.picture}
                    alt="Profile"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    style={{
                      width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
                      display: imgLoaded ? 'block' : 'none', // hide until loaded
                    }}
                  />
                </>
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--primary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: '#fff', fontWeight: 700,
                }}>
                  {user?.name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {user?.name ?? 'User'}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', margin: '4px 0 0' }}>
                  {user?.email ?? ''}
                </p>
              </div>
            </div>
          
            {/* Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              <InfoRow label="Birthday" value={formatDate(user?.dob)} />
              <InfoRow label="Height" value={formatHeight(user?.height_cm, user?.units)} />
              <InfoRow label="Weight" value={formatWeight(user?.weight, user?.units)} />
              {/* Dev Mode Toggle */}
              <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  marginTop: 12,
              }}>
                  <div>
                      <span style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 500 }}>
                          Developer Mode
                      </span>
                      <p style={{ fontSize: 11, color: 'var(--text-light)', margin: '2px 0 0' }}>
                          Enables manual location control on map
                      </p>
                  </div>
                  <button
                      onClick={() => toggleDevMode(!devModeEnabled)}
                      style={{
                          width: 44, height: 24, borderRadius: 12,
                          background: devModeEnabled ? 'var(--primary)' : 'var(--border)',
                          border: 'none', cursor: 'pointer', position: 'relative',
                          transition: 'background 0.2s', flexShrink: 0,
                      }}
                  >
                      <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: devModeEnabled ? 23 : 3,
                          transition: 'left 0.2s',
                      }} />
                  </button>
              </div>
            </div>
          
            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '12px 0',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--red, #ef4444)',
                background: 'none', color: 'var(--red, #ef4444)',
                fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  width: '100%', padding: '12px 0',
                  borderRadius: 'var(--radius-md)',
                  border: 'none', background: '#ef4444', color: '#fff',
                  fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', marginTop: 8,
                }}
              >
                Delete Account
              </button>
            ) : (
              <div style={{
                marginTop: 8, padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '2px solid #ef4444',
                background: '#fef2f2',
              }}>
                <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 600, margin: '0 0 4px' }}>
                  Delete Account
                </p>
                <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 12px' }}>
                  This cannot be undone. All your data will be permanently deleted.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowConfirm(false)}
                    style={{
                      flex: 1, padding: '10px 0',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid #d1d5db', background: '#fff',
                      color: 'var(--text)', fontFamily: 'inherit',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      flex: 1, padding: '10px 0',
                      borderRadius: 'var(--radius-md)',
                      border: 'none', background: '#ef4444',
                      color: '#fff', fontFamily: 'inherit',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
        
          </div>
        </div>
        <BottomNav active="" onChange={onNavigate} />
      </>
    );
}

function InfoRow({ label, value }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
      </div>
    );
}

function BackIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    );
}