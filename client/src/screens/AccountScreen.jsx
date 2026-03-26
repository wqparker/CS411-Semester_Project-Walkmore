import { useState } from 'react';
import { TopBar, BottomNav } from '../App';

// AccountScreen 

export default function AccountScreen({ onNavigate }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    height_ft: '5',
    height_in: '9',
    weight: '',
    units: 'imperial', // 'imperial' | 'metric'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(form.email)) newErrors.email = 'Enter a valid email address';

    // Password
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    // Confirm password
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    // Birthday
    if (!form.birthday) newErrors.birthday = 'Birthday is required';

    // Height
    if (form.units === 'imperial') {
      const ft = parseInt(form.height_ft, 10);
      const inches = parseInt(form.height_in, 10);
      if (isNaN(ft) || ft < 1 || ft > 8) newErrors.height = 'Enter a valid height';
      else if (isNaN(inches) || inches < 0 || inches > 11) newErrors.height = 'Inches must be 0–11';
    } else {
      const cm = parseInt(form.height_ft, 10); // reuse height_ft for cm in metric
      if (isNaN(cm) || cm < 50 || cm > 250) newErrors.height = 'Enter a valid height in cm';
    }

    // Weight
    const w = parseFloat(form.weight);
    if (!form.weight) newErrors.weight = 'Weight is required';
    else if (isNaN(w) || w <= 0) newErrors.weight = 'Enter a valid weight';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // TODO: POST form data to Express /api/auth/register when backend is ready
      setSubmitted(true);
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
              Welcome to WalkMore. Your journey to a healthier commute starts now.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => onNavigate('map')}
            >
              Start Walking
            </button>
          </div>
        </div>
        <BottomNav active="map" onChange={onNavigate} />
      </>
    );
  }

  // Form
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

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
            Join us to start your journey
          </p>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="hello@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={errors.email ? { borderColor: 'var(--red)' } : {}}
            />
            {errors.email && <p className="input-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                className="form-input has-right-icon"
                type={showPassword ? 'text' : 'password'}
                placeholder="········"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                style={errors.password ? { borderColor: 'var(--red)' } : {}}
              />
              <button
                className="input-icon-right"
                onClick={() => setShowPassword((p) => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input
                className="form-input has-right-icon"
                type={showConfirm ? 'text' : 'password'}
                placeholder="········"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                style={errors.confirmPassword ? { borderColor: 'var(--red)' } : {}}
              />
              <button
                className="input-icon-right"
                onClick={() => setShowConfirm((p) => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <p className="input-error">{errors.confirmPassword}</p>}
          </div>

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
                    type="number"
                    min="1" max="8"
                    value={form.height_ft}
                    onChange={(e) => update('height_ft', e.target.value)}
                    style={errors.height ? { borderColor: 'var(--red)' } : {}}
                  />
                  <span className="input-icon-right" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>ft</span>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="form-input has-right-icon"
                    type="number"
                    min="0" max="11"
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
                  type="number"
                  placeholder="170"
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

          {/* Submit */}
          <button className="btn-primary" onClick={handleSubmit}>
            Create Account
          </button>

          {/* Sign in link */}
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-mid)' }}>
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('map')}
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

// Icons 

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
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