// pages/symbols.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchSymbolAnalytics } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  tableRowHoverBg,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
} from '../lib/theme';

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('total_pnl');
  const [sortDesc, setSortDesc] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSymbolAnalytics();
      if (res.ok) {
        setSymbols(res.symbols || []);
      } else {
        setError(res.error || 'Failed to load symbol data');
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Sort symbols
  const sorted = [...symbols].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  function handleSort(col) {
    if (sortBy === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  }

  return (
    <Layout active="symbols">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Symbol Analytics
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Per-ticker performance breakdown
        </p>
      </div>

      {error && (
        <div style={{
          ...cardStyle,
          background: '#1a0a0a',
          borderColor: colors.error,
          color: colors.error,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: colors.textMuted, padding: 40 }}>Loading...</div>
      ) : symbols.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: colors.textMuted, padding: 40 }}>
          No symbol data available
        </div>
      ) : (
        <>
          {/* Symbol Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            {sorted.slice(0, 6).map(s => (
              <SymbolCard key={s.symbol} data={s} />
            ))}
          </div>

          {/* Full Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>All Symbols</span>
            </div>
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  <Th>Symbol</Th>
                  <SortTh col="total_pnl" sortBy={sortBy} sortDesc={sortDesc} onClick={handleSort}>P&L</SortTh>
                  <SortTh col="trade_count" sortBy={sortBy} sortDesc={sortDesc} onClick={handleSort}>Trades</SortTh>
                  <SortTh col="win_rate" sortBy={sortBy} sortDesc={sortDesc} onClick={handleSort}>Win Rate</SortTh>
                  <SortTh col="avg_pnl" sortBy={sortBy} sortDesc={sortDesc} onClick={handleSort}>Avg P&L</SortTh>
                  <SortTh col="avg_hold_min" sortBy={sortBy} sortDesc={sortDesc} onClick={handleSort}>Avg Hold</SortTh>
                  <Th>Best</Th>
                  <Th>Worst</Th>
                  <Th>Trend</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <HoverRow key={i} pnl={s.total_pnl}>
                    <Td style={{ fontWeight: 700, fontSize: 14 }}>{s.symbol}</Td>
                    <Td style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: s.total_pnl > 0 ? colors.accent : s.total_pnl < 0 ? colors.error : colors.textPrimary,
                    }}>
                      ${s.total_pnl.toFixed(2)}
                    </Td>
                    <Td style={{ fontFamily: 'monospace' }}>{s.trade_count}</Td>
                    <Td style={{
                      fontWeight: 600,
                      color: s.win_rate >= 50 ? colors.accent : colors.error,
                    }}>
                      {s.win_rate}%
                    </Td>
                    <Td style={{
                      fontFamily: 'monospace',
                      color: s.avg_pnl > 0 ? colors.accent : s.avg_pnl < 0 ? colors.error : colors.textPrimary,
                    }}>
                      ${s.avg_pnl.toFixed(2)}
                    </Td>
                    <Td style={{ fontFamily: 'monospace', color: colors.textMuted }}>
                      {s.avg_hold_min != null ? `${Math.round(s.avg_hold_min)}m` : '—'}
                    </Td>
                    <Td style={{ fontFamily: 'monospace', color: colors.accent }}>
                      ${s.best_trade.toFixed(2)}
                    </Td>
                    <Td style={{ fontFamily: 'monospace', color: colors.error }}>
                      ${s.worst_trade.toFixed(2)}
                    </Td>
                    <Td>
                      <MiniSparkline data={s.sparkline} />
                    </Td>
                  </HoverRow>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

// Components
function SymbolCard({ data }) {
  const s = data;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: colors.textPrimary }}>{s.symbol}</span>
        <span style={{
          fontWeight: 700,
          fontSize: 18,
          color: s.total_pnl > 0 ? colors.accent : s.total_pnl < 0 ? colors.error : colors.textPrimary,
        }}>
          ${s.total_pnl.toFixed(2)}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <MiniStat label="Trades" value={s.trade_count} />
        <MiniStat label="Win Rate" value={`${s.win_rate}%`} color={s.win_rate >= 50 ? colors.accent : colors.error} />
        <MiniStat label="Avg Hold" value={s.avg_hold_min != null ? `${Math.round(s.avg_hold_min)}m` : '—'} />
      </div>
      {s.sparkline && s.sparkline.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <MiniSparkline data={s.sparkline} height={30} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color = colors.textPrimary }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function MiniSparkline({ data, height = 20 }) {
  if (!data || data.length < 2) return <span style={{ color: colors.textMuted }}>—</span>;

  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * 60},${height - ((v - min) / range) * (height - 4)}`
  ).join(' ');

  const lastVal = data[data.length - 1];
  const strokeColor = lastVal >= 0 ? colors.accent : colors.error;

  return (
    <svg width="60" height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '12px 14px',
      fontSize: 12,
      fontWeight: 700,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {children}
    </th>
  );
}

function SortTh({ col, sortBy, sortDesc, onClick, children }) {
  const isActive = sortBy === col;
  return (
    <th
      onClick={() => onClick(col)}
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        fontSize: 12,
        fontWeight: 700,
        color: isActive ? colors.accent : colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {children} {isActive && (sortDesc ? '↓' : '↑')}
    </th>
  );
}

function Td({ children, style = {} }) {
  return (
    <td style={{ padding: '12px 14px', fontSize: 13, ...style }}>
      {children}
    </td>
  );
}

function HoverRow({ children, pnl }) {
  const [hovered, setHovered] = useState(false);
  const bgTint = pnl > 0 ? 'rgba(0, 255, 136, 0.03)'
               : pnl < 0 ? 'rgba(255, 71, 87, 0.03)'
               : 'transparent';
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: `1px solid ${colors.border}`,
        background: hovered ? tableRowHoverBg : bgTint,
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </tr>
  );
}
