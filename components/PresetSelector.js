import { colors, fontSize, fontWeight, shadows, transitions } from '../lib/theme';

const presetColors = {
  conservative: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: '🛡️' },
  balanced: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: '⚖️' },
  aggressive: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🔥' },
};

export default function PresetSelector({ presets, selected, onSelect, disabled }) {
  if (!presets || presets.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: '12px',
      }}>
        Trading Profile
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {presets.map((preset) => {
          const isSelected = selected === preset.id;
          const colorScheme = presetColors[preset.id] || presetColors.balanced;

          return (
            <button
              key={preset.id}
              onClick={() => !disabled && onSelect(preset.id)}
              disabled={disabled}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px',
                background: isSelected ? colorScheme.bg : colors.bgSecondary,
                border: `2px solid ${isSelected ? colorScheme.border : colors.border}`,
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: transitions.normal,
                textAlign: 'left',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '20px' }}>{colorScheme.icon}</span>
                <span style={{
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.semibold,
                  color: isSelected ? colorScheme.border : colors.textPrimary,
                }}>
                  {preset.name}
                </span>
                {isSelected && (
                  <span style={{
                    fontSize: fontSize.xs,
                    background: colorScheme.border,
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: fontWeight.medium,
                  }}>
                    Active
                  </span>
                )}
              </div>
              <p style={{
                fontSize: fontSize.sm,
                color: colors.textSecondary,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {preset.description}
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '12px',
                fontSize: fontSize.xs,
                color: colors.textMuted,
              }}>
                <span>Risk: {(preset.risk_per_trade_pct * 100).toFixed(1)}%</span>
                <span>Conf: {(preset.conf_threshold * 100).toFixed(0)}%</span>
                <span>Positions: {preset.max_open_positions}</span>
              </div>
            </button>
          );
        })}

        {/* Custom option */}
        <button
          onClick={() => !disabled && onSelect(null)}
          disabled={disabled}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '16px',
            background: selected === null ? 'rgba(139, 92, 246, 0.1)' : colors.bgSecondary,
            border: `2px solid ${selected === null ? '#8b5cf6' : colors.border}`,
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: transitions.normal,
            textAlign: 'left',
            borderStyle: 'dashed',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <span style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: selected === null ? '#8b5cf6' : colors.textPrimary,
            }}>
              Custom
            </span>
            {selected === null && (
              <span style={{
                fontSize: fontSize.xs,
                background: '#8b5cf6',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: fontWeight.medium,
              }}>
                Active
              </span>
            )}
          </div>
          <p style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            margin: 0,
            lineHeight: 1.4,
          }}>
            Fine-tune all settings manually
          </p>
        </button>
      </div>
    </div>
  );
}
