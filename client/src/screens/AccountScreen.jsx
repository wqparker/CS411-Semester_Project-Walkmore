import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { TopBar, BottomNav } from '../App';

export default function AccountScreen({ onNavigate }) {
  const { login } = useAuth();
  const [googleUser, setGoogleUser] = useState(null);
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({
    birthday: '',
    height_ft: '5',
    height_in: '9',
    weight: '',
    units: 'imperial',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [step, setStep] = useState('google'); // 'google' | 'profile'

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token, flow: 'register' }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error);
          return;
        }
        setGoogleUser({ name: data.name, email: data.email, picture: data.picture });
        setToken(data.token);
        setStep('profile');
      } catch {
        setAuthError('Something went wrong. Please try again.');
      }
    },
    onError: () => setAuthError('Google sign in failed'),
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.birthday) newErrors.birthday = 'Birthday is required';

    if (form.units === 'imperial') {
      const ft = parseInt(form.height_ft, 10);
      const inches = parseInt(form.height_in, 10);
      if (isNaN(ft) || ft < 1 || ft > 8) newErrors.height = 'Enter a valid height';
      else if (isNaN(inches) || inches < 0 || inches > 11) newErrors.height = 'Inches must be 0–11';
    } else {
      const cm = parseInt(form.height_ft, 10);
      if (isNaN(cm) || cm < 50 || cm > 250) newErrors.height = 'Enter a valid height in cm';
    }

    const w = parseFloat(form.weight);
    if (!form.weight) newErrors.weight = 'Weight is required';
    else if (isNaN(w) || w <= 0) newErrors.weight = 'Enter a valid weight';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const height_cm = form.units === 'imperial'
      ? (parseInt(form.height_ft) * 30.48) + (parseInt(form.height_in) * 2.54)
      : parseInt(form.height_ft);

    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dob: form.birthday,
          height_cm,
          weight: parseFloat(form.weight),
          units: form.units,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error);
        return;
      }

      login(googleUser, token);
      setSubmitted(true);
    } catch {
      setAuthError('Failed to save profile. Please try again.');
    }
  };

  // Success state
  if (submitted) {
    return (
      <>
        <TopBar onAvatarClick={() => {}} />
        <div className="screen-content">
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 32px', textAlign: 'center', gap: 16,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--green-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircleIcon />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Account Created!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.5 }}>
              Welcome to WalkMore, {googleUser?.name}. Your journey to a healthier commute starts now.
            </p>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => onNavigate('map')}>
              Start Walking
            </button>
          </div>
        </div>
        <BottomNav active="map" onChange={onNavigate} />
      </>
    );
  }

  // Step 1 - Google sign in
  if (step === 'google') {
    return (
      <>
        <TopBar onAvatarClick={() => {}} />
        <div className="screen-content">
          <div style={{ padding: '22px 20px 48px' }}>
            <button
              onClick={() => onNavigate('landing')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', padding: '0 0 16px 0',
              }}
            >
              <BackIcon /> Back
            </button>

            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Create Account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 32 }}>
              Sign in with Google to get started
            </p>

            {authError && (
              <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{authError}</p>
            )}

            <button
              onClick={() => handleGoogle()}
              style={{
                width: '100%', padding: '12px 0',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)',
                fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-mid)' }}>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('landing')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontWeight: 600, fontFamily: 'inherit', fontSize: 13,
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
        <BottomNav active="map" onChange={onNavigate} />
      </>
    );
  }

  // Step 2 - Profile form
  return (
    <>
      <TopBar onAvatarClick={() => {}} />
      <div className="screen-content">
        <div style={{ padding: '22px 20px 48px' }}>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Complete Your Profile
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
            Signed in as {googleUser?.email}
          </p>

          {authError && (
            <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{authError}</p>
          )}

          {/* Birthday */}
          <div className="form-group">
            <label className="form-label">Birthday</label>
            <div className="input-wrapper">
              <input
                className="form-input has-right-icon"
                type="date"
                value={form.birthday}
                onChange={(e) => update('birthday', e.target.value)}
                style={errors.birthday ? { borderColor: 'var(--red)' } : {}}
              />
              <span className="input-icon-right"><CalendarIcon /></span>
            </div>
            {errors.birthday && <p className="input-error">{errors.birthday}</p>}
          </div>

          {/* Preferred Measurements */}
          <div className="form-group">
            <label className="form-label">Preferred Measurements</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['imperial', 'metric'].map((unit) => (
                <button
                  key={unit}
                  onClick={() => update('units', unit)}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${form.units === unit ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.units === unit ? 'var(--text)' : 'var(--bg)',
                    color: form.units === unit ? '#fff' : 'var(--text-mid)',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {unit === 'imperial' ? 'Imperial (ft, lbs)' : 'Metric (cm, kg)'}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="form-group">
            <label className="form-label">Height</label>
            {form.units === 'imperial' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="form-input has-right-icon"
                    type="number" min="1" max="8"
                    value={form.height_ft}
                    onChange={(e) => update('height_ft', e.target.value)}
                    style={errors.height ? { borderColor: 'var(--red)' } : {}}
                  />
                  <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>ft</span>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="form-input has-right-icon"
                    type="number" min="0" max="11"
                    value={form.height_in}
                    onChange={(e) => update('height_in', e.target.value)}
                    style={errors.height ? { borderColor: 'var(--red)' } : {}}
                  />
                  <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>in</span>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input has-right-icon"
                  type="number" placeholder="170"
                  value={form.height_ft}
                  onChange={(e) => update('height_ft', e.target.value)}
                  style={errors.height ? { borderColor: 'var(--red)' } : {}}
                />
                <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>cm</span>
              </div>
            )}
            {errors.height && <p className="input-error">{errors.height}</p>}
          </div>

          {/* Weight */}
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label">Weight</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input has-right-icon"
                type="number"
                placeholder={form.units === 'imperial' ? '160' : '72'}
                value={form.weight}
                onChange={(e) => update('weight', e.target.value)}
                style={errors.weight ? { borderColor: 'var(--red)' } : {}}
              />
              <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>
                {form.units === 'imperial' ? 'lbs' : 'kg'}
              </span>
            </div>
            {errors.weight && <p className="input-error">{errors.weight}</p>}
          </div>

          <button className="btn-primary" onClick={handleSubmit}>
            Create Account
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

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
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