import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen({ onNavigate }) {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token, flow: 'login' }),
        });

        const data = await res.json();
        console.log('Login response:', data);

        if (!res.ok) {
          setError(data.error);
          return;
        }

        login(data.user, data.token);
        onNavigate('map');
      } catch {
        setError('Something went wrong. Please try again.');
      }
    },
    onError: () => setError('Google sign in failed'),
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', padding: '0 32px',
      background: 'var(--bg)', gap: 16,
    }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: '#fff', margin: '0 auto 12px',
        }}>✓</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>WalkMore</h1>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 4 }}>
          A healthier way to commute
        </p>
      </div>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: '0 0 8px' }}>
          {error}
        </p>
      )}

      <button className="btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('account')}>
        Create Account
      </button>

      <button
        onClick={() => handleSignIn()}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          border: '2px solid #d1d5db',
          background: 'var(--bg)', color: 'var(--text)',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <GoogleIcon /> Sign In with Google
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}