import { useState } from 'react';
import { darkTheme, fontSize, fontWeight, shadows, transitions, borderRadius } from '../lib/theme';

const colors = darkTheme;

const presetColors = {
  conservative: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', label: 'Conservative' },
  balanced: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', label: 'Balanced' },
  aggressive: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', label: 'Aggressive' },
};

// SVG Icons instead of emojis
const PresetIcon = ({ type }) => {
  const iconProps = { width: 20, height: 20, fill: 'currentColor', 'aria-hidden': 'true' };

  switch (type) {
    case 'conservative':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      );
    case 'aggressive':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
        </svg>
      );
    case 'custom':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      );
    default: // balanced
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
          <path d="M12 7c-2.76 0-5 2.24-5 5h2c0-1.65 1.35-3 3-3V7z"/>
        </svg>
      );
  }
};

export default function PresetSelector({ presets, selected, onSelect, disabled }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!presets || presets.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }} role="group" aria-labelledby="preset-heading">
      <h3
        id="preset-heading"
        style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: '12px',
        }}
      >
        Trading Profile
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
        role="radiogroup"
        aria-label="Select trading profile"
      >
        {presets.map((preset) => {
          const isSelected = selected === preset.id;
          const isHovered = hoveredId === preset.id;
          const colorScheme = presetColors[preset.id] || presetColors.balanced;

          return (
            <button
              key={preset.id}
              onClick={() => !disabled && onSelect(preset.id)}
              onMouseEnter={() => setHoveredId(preset.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${preset.name}: ${preset.description}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px',
                background: isSelected ? colorScheme.bg : colors.bgSecondary,
                border: `2px solid ${isSelected ? colorScheme.border : isHovered ? colors.borderLight : colors.border}`,
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                textAlign: 'left',
                transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <span style={{ color: isSelected ? colorScheme.border : colors.textSecondary }}>
                  <PresetIcon type={preset.id} />
                </span>
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
          onMouseEnter={() => setHoveredId('custom')}
          onMouseLeave={() => setHoveredId(null)}
          disabled={disabled}
          role="radio"
          aria-checked={selected === null}
          aria-label="Custom: Fine-tune all settings manually"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '16px',
            background: selected === null ? 'rgba(139, 92, 246, 0.1)' : colors.bgSecondary,
            border: `2px solid ${selected === null ? '#8b5cf6' : hoveredId === 'custom' ? colors.borderLight : colors.border}`,
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
            textAlign: 'left',
            borderStyle: 'dashed',
            transform: hoveredId === 'custom' && !disabled ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: hoveredId === 'custom' && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <span style={{ color: selected === null ? '#8b5cf6' : colors.textSecondary }}>
              <PresetIcon type="custom" />
            </span>
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
