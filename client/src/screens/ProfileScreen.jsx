import { useAuth } from '../context/AuthContext';
import { TopBar, BottomNav } from '../App';

export default function ProfileScreen({ onNavigate }) {
    const { user, token, logout } = useAuth();

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
      const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
      if (!confirmed) return;

      try {
        const res = await fetch('http://localhost:5000/api/auth/account', {
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
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
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

            <button
              onClick={handleDeleteAccount}
              style={{
                width: '100%', padding: '12px 0',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: '#ef4444', color: '#fff',
                fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', marginTop: 8,
              }}
            >
              Delete Account
            </button>
          
          </div>
        </div>
        <BottomNav active="map" onChange={onNavigate} />
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