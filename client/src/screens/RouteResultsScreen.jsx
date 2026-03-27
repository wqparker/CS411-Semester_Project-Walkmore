import { TopBar, BottomNav } from '../App';

export default function RouteResultsScreen({ onNavigate, routeData }) {
  const { route, optimization, destination } = routeData || {};

  const optimizationLabels = {
    time: 'Time Saving',
    walking: 'Walking Maximize',
    balanced: 'Balanced',
  };

  const walkPercentage = route
    ? ((route.walkT / route.totalT) * 100).toFixed(1)
    : 0;

  return (
    <>
      <TopBar onAvatarClick={() => onNavigate('account')} />

      <div className="screen-content">
        <div style={{ padding: '22px 20px 40px' }}>

          {/* Back button */}
          <button
            onClick={() => onNavigate('route')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--primary)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              padding: '0 0 16px 0',
            }}
          >
            <BackIcon /> Back to Planning
          </button>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Your Route
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
            {optimizationLabels[optimization]} · To: {destination}
          </p>

          {!route ? (
            <div style={{
              padding: 24,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              textAlign: 'center',
              color: 'var(--text-mid)',
            }}>
              No route data available.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <StatCard label="Total Time" value={`${route.totalT} min`} icon="⏱" />
                <StatCard label="Walking Time" value={`${route.walkT} min`} icon="🚶" />
                <StatCard label="Distance" value={`${(route.dist / 1000).toFixed(2)} km`} icon="📍" />
              </div>

              {/* Walking percentage bar */}
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Walking Share</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{walkPercentage}%</span>
                </div>
                <div style={{
                  height: 8,
                  background: 'var(--border)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${walkPercentage}%`,
                    background: 'var(--primary)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Route Path */}
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 24,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  Route Path
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  {route.path.map((stop, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        background: i === 0 || i === route.path.length - 1
                          ? 'var(--primary)'
                          : 'var(--border)',
                        color: i === 0 || i === route.path.length - 1
                          ? '#fff'
                          : 'var(--text)',
                        padding: '4px 10px',
                        borderRadius: 20,
                      }}>
                        {i === 0 ? 'Start' : i === route.path.length - 1 ? 'End' : stop}
                      </span>
                      {i < route.path.length - 1 && (
                        <span style={{ color: 'var(--text-mid)', fontSize: 14 }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigate button */}
              <button className="btn-primary" onClick={() => onNavigate('map')}>
                Start Navigation
              </button>
            </>
          )}
        </div>
      </div>

      <BottomNav active="map" onChange={onNavigate} />
    </>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 12px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{label}</div>
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