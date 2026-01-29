import { colors, fontSize } from '../lib/theme';

export default function GuardrailHint({ min, max, value, recommended, isPercent = false, decimals = 2 }) {
  // Calculate position of current value on the scale (0-100%)
  const range = max - min;
  const position = range > 0 ? ((value - min) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));

  // Format values for display
  const formatValue = (v) => {
    if (isPercent) {
      return `${(v * 100).toFixed(decimals)}%`;
    }
    return v.toFixed(decimals);
  };

  // Determine color based on position (green in middle, yellow/red at extremes)
  const getColor = (pos) => {
    if (pos < 20 || pos > 80) return '#ef4444'; // Red at extremes
    if (pos < 35 || pos > 65) return '#f59e0b'; // Yellow
    return '#22c55e'; // Green in middle
  };

  return (
    <div style={{ marginTop: '6px' }}>
      {/* Track */}
      <div style={{
        position: 'relative',
        height: '4px',
        background: `linear-gradient(to right,
          rgba(239, 68, 68, 0.3) 0%,
          rgba(245, 158, 11, 0.3) 20%,
          rgba(34, 197, 94, 0.3) 35%,
          rgba(34, 197, 94, 0.3) 65%,
          rgba(245, 158, 11, 0.3) 80%,
          rgba(239, 68, 68, 0.3) 100%
        )`,
        borderRadius: '2px',
      }}>
        {/* Current value indicator */}
        <div style={{
          position: 'absolute',
          left: `${clampedPosition}%`,
          top: '-3px',
          width: '10px',
          height: '10px',
          background: getColor(clampedPosition),
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          border: `2px solid ${colors.bgSecondary}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />

        {/* Recommended marker (if provided) */}
        {recommended !== undefined && (
          <div style={{
            position: 'absolute',
            left: `${((recommended - min) / range) * 100}%`,
            top: '-1px',
            width: '2px',
            height: '6px',
            background: colors.accent,
            transform: 'translateX(-50%)',
          }} />
        )}
      </div>

      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '4px',
        fontSize: fontSize.xs,
        color: colors.textMuted,
      }}>
        <span>{formatValue(min)}</span>
        {recommended !== undefined && (
          <span style={{ color: colors.accent }}>
            Rec: {formatValue(recommended)}
          </span>
        )}
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
