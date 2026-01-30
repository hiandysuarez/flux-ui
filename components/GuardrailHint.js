import { darkTheme, fontSize, visualEffects, fontFamily } from '../lib/theme';

export default function GuardrailHint({
  min,
  max,
  value,
  recommended,
  isPercent = false,
  decimals = 2,
  showTooltip = true,
}) {
  const colors = darkTheme;
  const effects = visualEffects;

  // Calculate position of current value on the scale (0-100%)
  const range = max - min;
  const position = range > 0 ? ((value - min) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));

  // Calculate recommended position
  const recommendedPosition = recommended !== undefined
    ? ((recommended - min) / range) * 100
    : 50;

  // Format values for display
  const formatValue = (v) => {
    if (isPercent) {
      return `${(v * 100).toFixed(decimals)}%`;
    }
    return Number.isInteger(v) ? v.toString() : v.toFixed(decimals);
  };

  // Determine color based on distance from recommended
  const getColor = (pos) => {
    const distance = Math.abs(pos - recommendedPosition);
    if (distance > 40) return colors.error;
    if (distance > 25) return colors.warning;
    return colors.success;
  };

  // Get zone description
  const getZoneDescription = (pos) => {
    const distance = Math.abs(pos - recommendedPosition);
    if (distance > 40) return 'High risk';
    if (distance > 25) return 'Moderate';
    return 'Optimal';
  };

  const indicatorColor = getColor(clampedPosition);
  const zoneText = getZoneDescription(clampedPosition);

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Track with gradient */}
      <div style={{
        position: 'relative',
        height: '6px',
        background: effects.safeZoneGradient,
        borderRadius: '3px',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
      }}>
        {/* Optimal zone highlight */}
        <div style={{
          position: 'absolute',
          left: '25%',
          right: '25%',
          top: 0,
          bottom: 0,
          background: 'rgba(63, 185, 80, 0.2)',
          borderRadius: '3px',
        }} />

        {/* Recommended marker - gold */}
        {recommended !== undefined && (
          <div style={{
            position: 'absolute',
            left: `${recommendedPosition}%`,
            top: '-2px',
            width: '3px',
            height: '10px',
            background: colors.accent,
            transform: 'translateX(-50%)',
            borderRadius: '2px',
            boxShadow: `0 0 8px ${colors.accent}`,
          }} />
        )}

        {/* Current value indicator */}
        <div style={{
          position: 'absolute',
          left: `${clampedPosition}%`,
          top: '-5px',
          width: '16px',
          height: '16px',
          background: indicatorColor,
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          border: `2px solid ${colors.bgSecondary}`,
          boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 10px ${indicatorColor}50`,
          transition: 'all 0.25s ease',
        }} />
      </div>

      {/* Labels row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        fontSize: fontSize.xs,
      }}>
        <span style={{
          color: colors.textMuted,
          fontFamily: fontFamily.mono,
          fontSize: '11px',
        }}>
          {formatValue(min)}
        </span>

        {/* Center info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
        }}>
          {recommended !== undefined && (
            <span style={{
              color: colors.accent,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: colors.accent,
                borderRadius: '2px',
                boxShadow: `0 0 4px ${colors.accent}`,
              }} />
              <span style={{ fontFamily: fontFamily.mono }}>
                {formatValue(recommended)}
              </span>
            </span>
          )}
          {showTooltip && (
            <span style={{
              color: indicatorColor,
              fontWeight: 600,
              padding: '2px 8px',
              background: `${indicatorColor}15`,
              borderRadius: '4px',
              fontSize: '10px',
            }}>
              {zoneText}
            </span>
          )}
        </div>

        <span style={{
          color: colors.textMuted,
          fontFamily: fontFamily.mono,
          fontSize: '11px',
        }}>
          {formatValue(max)}
        </span>
      </div>
    </div>
  );
}
