import { useState } from 'react';
import { TopBar, BottomNav } from '../App';

// Mock Data 

const WEEKLY_DATA = [
  { day: 'Mon', steps: 6200 },
  { day: 'Tue', steps: 8900 },
  { day: 'Wed', steps: 7400 },
  { day: 'Thu', steps: 11200 },
  { day: 'Fri', steps: 9654 },
  { day: 'Sat', steps: 4300 },
  { day: 'Sun', steps: 3100 },
];

const DAILY_GOAL = 10000;
const TODAY_STEPS = 9654;
const CALORIES_BURNED = 386;
const WEEKLY_AVERAGE = Math.round(
  WEEKLY_DATA.reduce((sum, d) => sum + d.steps, 0) / WEEKLY_DATA.length
);

const RECENT_ROUTES = [
  { destination: 'Times Square', date: 'Today, 9:15 AM', steps: 3240, duration: '28 min', walking: '18 min walk' },
  { destination: 'Central Park', date: 'Yesterday, 5:30 PM', steps: 4812, duration: '41 min', walking: '31 min walk' },
  { destination: 'Brooklyn Bridge', date: 'Mar 24, 8:00 AM', steps: 2190, duration: '22 min', walking: '12 min walk' },
];

// ProgressScreen 

export default function ProgressScreen({ onNavigate }) {
  const [period, setPeriod] = useState('week'); // 'week' | 'month'

  const goalPercent = Math.min(Math.round((TODAY_STEPS / DAILY_GOAL) * 100), 100);
  const maxSteps = Math.max(...WEEKLY_DATA.map((d) => d.steps));

  return (
    <>
      <TopBar onAvatarClick={() => onNavigate('profile')} />
      <div className="screen-content">
        <div style={{ padding: '22px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Progress & Insights
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
              Track your walking journey and health benefits
            </p>
          </div>

          {/* Steps Today Card */}
          <StatCard
            icon={<FootstepsIcon />}
            iconBg="var(--primary-light)"
            iconColor="var(--primary)"
            label="Steps Today"
            value={TODAY_STEPS.toLocaleString()}
            sub={`${goalPercent}% of daily goal`}
            extra={
              <ProgressBar percent={goalPercent} color="var(--primary)" />
            }
          />

          {/* Calories Card */}
          <StatCard
            icon={<FlameIcon />}
            iconBg="var(--orange-light)"
            iconColor="var(--orange)"
            label="Calories Burned"
            value={CALORIES_BURNED.toLocaleString()}
            sub="Based on walking activity"
          />

          {/* Weekly Average Card */}
          <StatCard
            icon={<TrendIcon />}
            iconBg="var(--green-light)"
            iconColor="var(--green)"
            label="Weekly Average"
            value={WEEKLY_AVERAGE.toLocaleString()}
            sub="Steps per day"
          />

          {/* Weekly Activity Chart */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Weekly Activity
              </span>
              {/* Period toggle */}
              <div style={{
                display: 'flex', background: 'var(--surface)',
                borderRadius: 20, padding: 3, gap: 2,
              }}>
                {['week', 'month'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: 'none',
                      background: period === p ? 'var(--primary)' : 'transparent',
                      color: period === p ? '#fff' : 'var(--text-mid)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Daily Steps</span>
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
              {WEEKLY_DATA.map((d, i) => {
                const heightPct = (d.steps / maxSteps) * 100;
                const isToday = i === 4; // Friday = today in mock data
                return (
                  <div
                    key={d.day}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: isToday ? 'var(--primary)' : 'var(--primary-border)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                        minHeight: 4,
                      }}
                    />
                    <span style={{
                      fontSize: 10,
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'var(--primary)' : 'var(--text-light)',
                    }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Y-axis hints */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>0</span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
                {Math.round(maxSteps / 2 / 1000)}k
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
                {Math.round(maxSteps / 1000)}k
              </span>
            </div>
          </div>

          {/* Daily Goal Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Daily Goal</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                {TODAY_STEPS.toLocaleString()} / {DAILY_GOAL.toLocaleString()} steps
              </span>
            </div>
            <ProgressBar percent={goalPercent} color="var(--primary)" height={10} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                {(DAILY_GOAL - TODAY_STEPS).toLocaleString()} steps remaining
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                {goalPercent}%
              </span>
            </div>
          </div>

          {/* Recent Routes */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Recent Routes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RECENT_ROUTES.map((route, i) => (
                <div key={i} style={{
                  ...cardStyle,
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                }}>
                  {/* Route icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <RouteIcon />
                  </div>
                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {route.destination}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{route.date}</div>
                  </div>
                  {/* Stats */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {route.steps.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>steps</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <BottomNav active="progress" onChange={onNavigate} />
    </>
  );
}

// Shared sub-components

const cardStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  boxShadow: 'var(--shadow-sm)',
};

function StatCard({ icon, iconBg, iconColor, label, value, sub, extra }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      {extra && <div style={{ marginTop: 12 }}>{extra}</div>}
    </div>
  );
}

function ProgressBar({ percent, color, height = 7 }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: height,
      background: 'var(--surface)', overflow: 'hidden',
    }}>
      <div style={{
        width: `${percent}%`, height: '100%',
        background: color, borderRadius: height,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// Icons

function FootstepsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0z" />
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}