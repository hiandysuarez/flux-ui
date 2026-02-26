import { useState } from 'react';
import { darkTheme, fontSize, fontWeight, shadows, transitions, borderRadius } from '../lib/theme';

const colors = darkTheme;

const fluxColors = { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' };
const customColors = { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' };

// SVG Icons
const PresetIcon = ({ type }) => {
  const iconProps = { width: 20, height: 20, fill: 'currentColor', 'aria-hidden': 'true' };

  if (type === 'custom') {
    return (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    );
  }
  // flux icon (default)
  return (
    <svg {...iconProps} viewBox="0 0 24 24">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
      <path d="M12 7c-2.76 0-5 2.24-5 5h2c0-1.65 1.35-3 3-3V7z"/>
    </svg>
  );
};

export default function PresetSelector({ presets, selected, onSelect, disabled }) {
  const [hoveredId, setHoveredId] = useState(null);

  // "Flux Settings" maps to the 'balanced' preset internally
  const isFluxSelected = selected === 'balanced';
  const isCustomSelected = selected === null;

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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
        role="radiogroup"
        aria-label="Select trading profile"
      >
        {/* Flux Settings option */}
        <button
          onClick={() => !disabled && onSelect('balanced')}
          onMouseEnter={() => setHoveredId('flux')}
          onMouseLeave={() => setHoveredId(null)}
          disabled={disabled}
          role="radio"
          aria-checked={isFluxSelected}
          aria-label="Flux Settings: Optimized default trading profile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '16px',
            background: isFluxSelected ? fluxColors.bg : colors.bgSecondary,
            border: `2px solid ${isFluxSelected ? fluxColors.border : hoveredId === 'flux' ? colors.borderLight : colors.border}`,
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
            textAlign: 'left',
            transform: hoveredId === 'flux' && !disabled ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: hoveredId === 'flux' && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <span style={{ color: isFluxSelected ? fluxColors.border : colors.textSecondary }}>
              <PresetIcon type="flux" />
            </span>
            <span style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: isFluxSelected ? fluxColors.border : colors.textPrimary,
            }}>
              Flux Settings
            </span>
            {isFluxSelected && (
              <span style={{
                fontSize: fontSize.xs,
                background: fluxColors.border,
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
            Optimized default trading profile
          </p>
        </button>

        {/* Custom option */}
        <button
          onClick={() => !disabled && onSelect(null)}
          onMouseEnter={() => setHoveredId('custom')}
          onMouseLeave={() => setHoveredId(null)}
          disabled={disabled}
          role="radio"
          aria-checked={isCustomSelected}
          aria-label="Custom: Fine-tune all settings manually"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '16px',
            background: isCustomSelected ? customColors.bg : colors.bgSecondary,
            border: `2px solid ${isCustomSelected ? customColors.border : hoveredId === 'custom' ? colors.borderLight : colors.border}`,
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
            <span style={{ color: isCustomSelected ? customColors.border : colors.textSecondary }}>
              <PresetIcon type="custom" />
            </span>
            <span style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: isCustomSelected ? customColors.border : colors.textPrimary,
            }}>
              Custom
            </span>
            {isCustomSelected && (
              <span style={{
                fontSize: fontSize.xs,
                background: customColors.border,
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
