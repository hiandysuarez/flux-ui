// components/Skeleton.js - Reusable skeleton loading components
import { darkTheme, borderRadius, spacing } from '../lib/theme';

const colors = darkTheme;

/**
 * Base skeleton styles
 */
const baseStyle = {
  background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

/**
 * SkeletonBox - Basic rectangular skeleton
 */
export function SkeletonBox({ width = '100%', height = 20, radius = borderRadius.sm, style = {} }) {
  return (
    <div
      style={{
        ...baseStyle,
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText - Text line skeleton with realistic widths
 */
export function SkeletonText({ lines = 1, widths = [], style = {} }) {
  const defaultWidths = ['100%', '85%', '70%', '90%', '60%'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...baseStyle,
            width: widths[i] || defaultWidths[i % defaultWidths.length],
            height: 14,
            borderRadius: borderRadius.sm,
          }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCircle - Circular skeleton (avatars, icons)
 */
export function SkeletonCircle({ size = 40 }) {
  return (
    <div
      style={{
        ...baseStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonCard - Full card skeleton matching cardStyle
 */
export function SkeletonCard({ height = 120, showHeader = true, showBody = true }) {
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
      aria-hidden="true"
    >
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <SkeletonBox width={100} height={12} />
        </div>
      )}
      {showBody && (
        <>
          <SkeletonBox width="60%" height={32} radius={borderRadius.md} />
          <SkeletonText lines={2} widths={['80%', '50%']} />
        </>
      )}
    </div>
  );
}

/**
 * SkeletonStatCard - Matches dashboard stat card layout
 */
export function SkeletonStatCard() {
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
      aria-hidden="true"
    >
      <SkeletonBox width={80} height={12} />
      <SkeletonBox width={120} height={36} radius={borderRadius.md} />
      <SkeletonBox width={60} height={14} />
    </div>
  );
}

/**
 * SkeletonTableRow - Table row skeleton
 */
export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td
          key={i}
          style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <SkeletonBox
            width={i === 0 ? 80 : i === columns - 1 ? 60 : '100%'}
            height={16}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * SkeletonTable - Full table skeleton
 */
export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}
      aria-hidden="true"
      role="presentation"
    >
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th
              key={i}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                background: colors.bgSecondary,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <SkeletonBox width={60 + Math.random() * 40} height={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

/**
 * SkeletonChart - Chart placeholder skeleton
 */
export function SkeletonChart({ height = 200 }) {
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width={120} height={16} />
        <SkeletonBox width={80} height={24} radius={borderRadius.full} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: spacing.xs, paddingTop: spacing.md }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...baseStyle,
              flex: 1,
              height: `${30 + Math.random() * 70}%`,
              borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonList - List of items skeleton
 */
export function SkeletonList({ items = 5, showAvatar = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            background: colors.bgCard,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}
        >
          {showAvatar && <SkeletonCircle size={32} />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width="70%" height={14} />
            <SkeletonBox width="40%" height={12} />
          </div>
          <SkeletonBox width={60} height={20} radius={borderRadius.full} />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonDashboard - Full dashboard skeleton matching index.js layout
 */
export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }} aria-hidden="true">
      {/* Hero section */}
      <div
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.xl,
          padding: spacing.xxl,
          textAlign: 'center',
        }}
      >
        <SkeletonBox width={100} height={14} style={{ margin: '0 auto 12px' }} />
        <SkeletonBox width={200} height={56} radius={borderRadius.lg} style={{ margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.xl }}>
          <SkeletonBox width={80} height={20} />
          <SkeletonBox width={80} height={20} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.lg }}>
        {/* Recent trades */}
        <div
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
          }}
        >
          <SkeletonBox width={120} height={18} style={{ marginBottom: spacing.lg }} />
          <SkeletonTable rows={5} columns={5} />
        </div>

        {/* Quick links */}
        <div
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
          }}
        >
          <SkeletonBox width={100} height={18} style={{ marginBottom: spacing.lg }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} height={48} radius={borderRadius.md} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonChart,
  SkeletonList,
  SkeletonDashboard,
};
