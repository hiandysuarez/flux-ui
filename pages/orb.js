// pages/orb.js - ORB Strategy Dashboard
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchORBStatus, fetchORBSettings, fetchORBAnalytics } from '../lib/api';
import { DEFAULT_TICKERS, ORB_STATE_COLORS, ORB_STATE_LABELS, CATEGORY_COLORS } from '../lib/tickers';
import {
  darkTheme,
  borderRadius,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  cardStyle,
} from '../lib/theme';

export default function ORBDashboard() {
  const [trackers, setTrackers] = useState({});
  const [activeSetups, setActiveSetups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const colors = darkTheme;

  const fetchData = async () => {
    try {
      const [statusRes, settingsRes, analyticsRes] = await Promise.allSettled([
        fetchORBStatus(),
        fetchORBSettings(),
        fetchORBAnalytics(),
      ]);

      if (statusRes.status === 'fulfilled') {
        setTrackers(statusRes.value?.trackers || {});
        setActiveSetups(statusRes.value?.active_setups || []);
      }
      if (settingsRes.status === 'fulfilled') {
        console.log('ORB API Response:', settingsRes.value);
        const extractedSettings = settingsRes.value?.orb || settingsRes.value?.settings || settingsRes.value;
        console.log('Extracted settings:', extractedSettings);
        console.log('orb_enabled:', extractedSettings?.orb_enabled);
        setSettings(extractedSettings);
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value?.analytics || analyticsRes.value);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch ORB data');
      console.error('ORB fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Get tickers to display based on settings
  const displayTickers = settings?.tickers
    ? DEFAULT_TICKERS.filter((t) => settings.tickers.includes(t.symbol))
    : DEFAULT_TICKERS.filter((t) => t.enabled);

  // Card style
  const card = {
    background: colors.bgCard,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  };

  const cardBody = {
    padding: spacing.md,
  };

  return (
    <Layout active="orb">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.md,
        }}>
          <div>
            <h1 style={{
              fontSize: fontSize.xl,
              fontWeight: fontWeight.bold,
              color: colors.textPrimary,
              marginBottom: 4,
            }}>
              ORB Strategy
            </h1>
            <p style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
              Opening Range Breakout - Monitoring {displayTickers.length} tickers
              {lastUpdate && (
                <span style={{ marginLeft: 8 }}>
                  | Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: borderRadius.md,
              background: colors.bgTertiary,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: spacing.md,
            background: colors.errorDark,
            border: `1px solid ${colors.error}`,
            borderRadius: borderRadius.md,
            color: colors.error,
            fontSize: fontSize.sm,
          }}>
            {error}
          </div>
        )}

        {/* Active Setups Alert */}
        {activeSetups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {activeSetups.map((setup) => (
              <div
                key={setup.symbol}
                style={{
                  padding: spacing.md,
                  background: colors.successDark,
                  border: `1px solid ${colors.success}`,
                  borderRadius: borderRadius.md,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <span style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.bold,
                    color: colors.success,
                  }}>
                    {setup.symbol}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: borderRadius.sm,
                    background: setup.direction === 'long' ? colors.successDark : colors.errorDark,
                    color: setup.direction === 'long' ? colors.success : colors.error,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.semibold,
                    textTransform: 'uppercase',
                  }}>
                    {setup.direction}
                  </span>
                </div>
                <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                  Entry: ${setup.entry_price?.toFixed(2)} | Target: ${setup.target_2?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {analytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: spacing.md,
          }}>
            <div style={{ ...card, ...cardBody }}>
              <div style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 }}>
                Total ORB Trades
              </div>
              <div style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary }}>
                {analytics.total_trades || 0}
              </div>
            </div>
            <div style={{ ...card, ...cardBody }}>
              <div style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 }}>
                Win Rate
              </div>
              <div style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: (analytics.win_rate || 0) >= 0.5 ? colors.success : colors.error,
              }}>
                {((analytics.win_rate || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ ...card, ...cardBody }}>
              <div style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 }}>
                Total P&L
              </div>
              <div style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: (analytics.total_pnl || 0) >= 0 ? colors.success : colors.error,
              }}>
                ${(analytics.total_pnl || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ ...card, ...cardBody }}>
              <div style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 }}>
                Profit Factor
              </div>
              <div style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: (analytics.profit_factor || 0) >= 1 ? colors.success : colors.error,
              }}>
                {analytics.profit_factor === Infinity ? 'N/A' : (analytics.profit_factor || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* ORB Settings Status */}
        {settings && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: borderRadius.full,
              background: settings.orb_enabled ? colors.successDark : colors.errorDark,
              border: `1px solid ${settings.orb_enabled ? colors.success : colors.error}`,
              color: settings.orb_enabled ? colors.success : colors.error,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.semibold,
            }}>
              ORB: {settings.orb_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: borderRadius.full,
              background: colors.infoDark,
              border: `1px solid ${colors.info}`,
              color: colors.info,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.semibold,
            }}>
              Mode: {settings.stocks_mode ? 'Stocks' : 'Futures'}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: borderRadius.full,
              background: colors.bgTertiary,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.semibold,
            }}>
              Min R/R: {settings.orb_min_rr_ratio || 2}:1
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: borderRadius.full,
              background: colors.bgTertiary,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.semibold,
            }}>
              Confluence: {settings.confluence_min || 2}+
            </span>
            {settings.orb_llm_filter && (
              <span style={{
                padding: '4px 12px',
                borderRadius: borderRadius.full,
                background: colors.accentDark,
                border: `1px solid ${colors.accent}`,
                color: colors.accent,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
              }}>
                LLM Filter
              </span>
            )}
          </div>
        )}

        {/* Ticker Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: spacing.md,
        }}>
          {displayTickers.map((ticker) => {
            const status = trackers[ticker.symbol];
            const state = status?.state || 'WAITING_FOR_OPEN';
            const stateColor = ORB_STATE_COLORS[state] || colors.textMuted;
            const stateLabel = ORB_STATE_LABELS[state] || state;
            const categoryColor = CATEGORY_COLORS[ticker.category] || colors.textMuted;

            return (
              <div
                key={ticker.symbol}
                style={{
                  ...card,
                  ...cardBody,
                  borderLeft: `3px solid ${stateColor}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}>
                  <div style={{
                    fontSize: fontSize.md,
                    fontWeight: fontWeight.bold,
                    color: colors.textPrimary,
                  }}>
                    {ticker.symbol}
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: stateColor,
                    boxShadow: state === 'SETUP_READY' ? `0 0 8px ${stateColor}` : 'none',
                    animation: state === 'SETUP_READY' ? 'pulse 2s infinite' : 'none',
                  }} />
                </div>

                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  marginBottom: spacing.xs,
                }}>
                  {ticker.name}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: fontSize.xs,
                    color: stateColor,
                    fontWeight: fontWeight.medium,
                  }}>
                    {stateLabel}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: categoryColor,
                    textTransform: 'uppercase',
                  }}>
                    {ticker.category}
                  </span>
                </div>

                {/* Show range info if available */}
                {status?.orb_high && status?.orb_low && (
                  <div style={{
                    marginTop: spacing.xs,
                    paddingTop: spacing.xs,
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                  }}>
                    H: ${status.orb_high.toFixed(2)} | L: ${status.orb_low.toFixed(2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* State Legend */}
        <div style={{ ...card, ...cardBody }}>
          <h3 style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: colors.textMuted,
            marginBottom: spacing.sm,
          }}>
            State Legend
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.md,
            fontSize: fontSize.xs,
          }}>
            {Object.entries(ORB_STATE_LABELS).map(([state, label]) => (
              <span key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: borderRadius.sm,
                  background: ORB_STATE_COLORS[state],
                }} />
                <span style={{ color: colors.textSecondary }}>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Layout>
  );
}
