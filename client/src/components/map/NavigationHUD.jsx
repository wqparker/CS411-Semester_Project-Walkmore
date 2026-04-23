export default function NavigationHUD({ directions, currentStepIndex, onEndTrip, onFitRoute }) {
  if (!directions[currentStepIndex]) return null;

  const step = directions[currentStepIndex];
  const isArrived = step.type === 'arrive';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1200,
      pointerEvents: 'none',
      background: isArrived ? '#10B981' : 'var(--bg)',
      borderBottom: `1px solid ${isArrived ? '#10B981' : 'var(--border)'}`,
      padding: '14px 16px 20px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    }}>
      <div style={{ pointerEvents: 'all' }}>

        {/* Step instruction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>{step.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: isArrived ? '#fff' : 'var(--text)' }}>
              {step.instruction}
            </div>
            <div style={{ fontSize: 12, color: isArrived ? 'rgba(255,255,255,0.8)' : 'var(--text-mid)', marginTop: 2 }}>
              {step.subtext}
            </div>
          </div>
        </div>

        {/* Progress + buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: isArrived ? 'rgba(255,255,255,0.8)' : 'var(--text-mid)' }}>
            Step {currentStepIndex + 1} of {directions.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isArrived && (
              <button onClick={onFitRoute}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--red, #ef4444)', background: 'none',
                  color: 'var(--red, #ef4444)', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                ⊙ Overview
              </button>
            )}
            <button onClick={onEndTrip}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                border: isArrived ? 'none' : '2px solid var(--red, #ef4444)',
                background: isArrived ? 'rgba(255,255,255,0.2)' : 'none',
                color: isArrived ? '#fff' : 'var(--red, #ef4444)',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              {isArrived ? 'Done' : '■ End Trip'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}