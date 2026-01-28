// pages/history.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchTradeHistory } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  buttonStyle,
  buttonPrimaryStyle,
  inputStyle,
  tableRowHoverBg,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
} from '../lib/theme';

export default function HistoryPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  // Filters
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState('');
  const [win, setWin] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTradeHistory({
        page,
        limit,
        symbol: symbol || undefined,
        side: side || undefined,
        win: win === '' ? undefined : win === 'true',
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      if (res.ok) {
        setTrades(res.trades || []);
        setPages(res.pages || 1);
        setTotal(res.total || 0);
      } else {
        setError(res.error || 'Failed to load trades');
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  function applyFilters() {
    setPage(1);
    load();
  }

  function clearFilters() {
    setSymbol('');
    setSide('');
    setWin('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(load, 0);
  }

  function exportCsv() {
    if (!trades.length) return;
    const headers = ['Date', 'Symbol', 'Side', 'Qty', 'Price', 'P&L', 'P&L %', 'Hold Min', 'Result', 'Exit Reason'];
    const rows = trades.map(t => [
      t.ts ? new Date(t.ts).toLocaleString() : '',
      t.symbol,
      t.side,
      t.qty,
      t.fill_price,
      t.pnl,
      t.pnl_pct,
      t.hold_minutes,
      t.win ? 'WIN' : 'LOSS',
      t.exit_reason || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <Layout active="history">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Trade History
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Complete trade log with filtering and export
        </p>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. QQQ"
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Side</label>
            <select value={side} onChange={e => setSide(e.target.value)} style={{ ...inputStyle, width: 100 }}>
              <option value="">All</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Result</label>
            <select value={win} onChange={e => setWin(e.target.value)} style={{ ...inputStyle, width: 100 }}>
              <option value="">All</option>
              <option value="true">Win</option>
              <option value="false">Loss</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ ...inputStyle, width: 140 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ ...inputStyle, width: 140 }}
            />
          </div>
          <button onClick={applyFilters} style={buttonPrimaryStyle}>Apply</button>
          <button onClick={clearFilters} style={buttonStyle}>Clear</button>
          <button onClick={exportCsv} style={{ ...buttonStyle, marginLeft: 'auto' }}>Export CSV</button>
        </div>
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

      {/* Results count */}
      <div style={{ marginBottom: 12, color: colors.textMuted, fontSize: 13 }}>
        {total} trades found
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              <Th>Date</Th>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Qty</Th>
              <Th>Price</Th>
              <Th>P&L</Th>
              <Th>P&L %</Th>
              <Th>Hold</Th>
              <Th>Result</Th>
              <Th>Exit Reason</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>
                  Loading...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>
                  No trades found
                </td>
              </tr>
            ) : (
              trades.map((t, i) => (
                <HoverRow key={i} pnl={t.pnl}>
                  <Td style={{ fontSize: 12, color: colors.textMuted }}>
                    {t.ts ? new Date(t.ts).toLocaleString() : '—'}
                  </Td>
                  <Td style={{ fontWeight: 700 }}>{t.symbol}</Td>
                  <Td>
                    <span style={{ color: t.side === 'BUY' ? colors.accent : colors.error }}>
                      {t.side}
                    </span>
                  </Td>
                  <Td style={{ fontFamily: 'monospace' }}>{t.qty}</Td>
                  <Td style={{ fontFamily: 'monospace' }}>${Number(t.fill_price || 0).toFixed(2)}</Td>
                  <Td style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: t.pnl > 0 ? colors.accent : t.pnl < 0 ? colors.error : colors.textPrimary,
                  }}>
                    ${Number(t.pnl || 0).toFixed(2)}
                  </Td>
                  <Td style={{
                    fontFamily: 'monospace',
                    color: t.pnl_pct > 0 ? colors.accent : t.pnl_pct < 0 ? colors.error : colors.textPrimary,
                  }}>
                    {(Number(t.pnl_pct || 0) * 100).toFixed(2)}%
                  </Td>
                  <Td style={{ fontFamily: 'monospace', color: colors.textMuted }}>
                    {t.hold_minutes != null ? `${Math.round(t.hold_minutes)}m` : '—'}
                  </Td>
                  <Td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: t.win ? colors.accentDark : '#1a0a0a',
                      color: t.win ? colors.accent : colors.error,
                      fontWeight: 700,
                      fontSize: 12,
                    }}>
                      {t.win ? 'WIN' : 'LOSS'}
                    </span>
                  </Td>
                  <Td style={{ fontSize: 12, color: colors.textMuted }}>
                    {t.exit_reason || '—'}
                  </Td>
                </HoverRow>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ ...buttonStyle, opacity: page <= 1 ? 0.5 : 1 }}
          >
            Prev
          </button>
          <span style={{ padding: '8px 16px', color: colors.textMuted }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            style={{ ...buttonStyle, opacity: page >= pages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </Layout>
  );
}

// Components
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
