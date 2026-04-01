> **CRITICAL: This project consists of ONLY TWO repositories: `GPT5-Trade` and `flux-ui`. The `Midas` repository belongs to a DIFFERENT project and must NOT be touched or modified.**

> **IMPORTANT: The backend (`GPT5-Trade`) is a separate repo at `C:/Users/hsuar/Documents/GPT5-Trade/`. Always read the backend CLAUDE.md before making changes that touch API contracts or settings fields.**

> **DEPLOYMENT: flux-ui is deployed on Vercel. Push to `main` to deploy automatically. No manual deploy step needed.**

# Flux UI Project Manual (Internal)
# Last updated by Claude: 2026-03-30

---

## 0) What flux-ui is

**flux-ui** is the Next.js frontend for the Flux intraday trading system. It provides:

* **Dashboard**: Today's P&L, active positions, recent trades
* **Analytics**: Performance charts, win rate, equity curve
* **History**: Paginated trade history with filters and CSV export
* **Symbols**: Per-symbol performance breakdown
* **Timing**: Performance by hour and day of week
* **Settings**: Admin and user configuration (two-tier: admin_settings + user_settings)
* **Optimize**: Backtest parameter optimizer, what-if analysis, Flux Settings card
* **Onboarding**: New user preset selection flow

The frontend talks exclusively to the `GPT5-Trade` FastAPI backend on Render.

---

## 1) Repository & Tech Stack

* **Framework**: Next.js (Pages Router)
* **Language**: JavaScript/React
* **Auth**: Supabase auth (via `lib/auth.js`)
* **Styling**: CSS-in-JS (inline styles using design tokens from `lib/theme.js`)
* **Fonts**: Plus Jakarta Sans (primary), IBM Plex Mono (numbers), DM Sans (display), JetBrains Mono (monospace)
* **Icons**: None — emoji or unicode characters only
* **Charts**: Custom SVG (no chart library)

---

## 2) File Structure

```
flux-ui/
  components/
    Layout.js               # Main layout: hamburger menu, header, nav, theme toggle
    PresetSelector.js       # Trading preset selection component
    GuardrailHint.js        # Settings validation hints
    SubscriptionBanner.js   # Warning banner for subscription limits
    ErrorBoundary.js        # Global error boundary (catches unhandled JS errors)

  lib/
    api.js                  # All backend API calls (fetchWithRetry, auth headers)
    auth.js                 # Supabase auth context (AuthProvider, useAuth)
    supabase.js             # Supabase client initialization
    theme.js                # Design system tokens (colors, fonts, shadows)
    themeContext.js         # Theme context provider (ThemeProvider, useTheme)

  pages/
    _app.js                 # Global styles, ThemeProvider, AuthProvider, ErrorBoundary
    _document.js            # Custom document with Google Fonts
    index.js                # Dashboard (P&L hero, positions, recent activity)
    landing.js              # Public landing page (unauthenticated)
    analytics.js            # Analytics overview with cumulative P&L chart
    history.js              # Trade history with Strategy column and filter pills
    login.js                # Login/signup page
    onboarding.js           # New user preset selection
    optimize.js             # Parameter optimizer + what-if analysis + Flux Settings
    settings.js             # Settings (admin/user views, tabs)
    symbols.js              # Per-symbol performance with sparklines
    timing.js               # Performance by hour/day of week
    verify.js               # Email verification page
    upgrade.js              # Subscription upgrade/pricing page
    404.js                  # Custom 404 page

  public/
    images/
      flux_new_logo.png     # Current logo (used in header)
      flux_logo.png         # Old logo (unused)
```

### Deleted pages (2026-03-30)
- `pages/orb.js` — ORB strategy dashboard (removed with ORB strategy)
- `pages/tickers.js` — ORB ticker state viewer (removed)

---

## 3) Design System (`lib/theme.js`) — "Dark Luxe"

### Colors
| Token | Value | Use |
|-------|-------|-----|
| `bgPrimary` | `#0D1117` | Page background |
| `bgSecondary` | `#161B22` | Card backgrounds |
| `bgTertiary` | `#21262D` | Input backgrounds, hover states |
| `accent` | `#D4A574` | Gold — primary accent |
| `accentHover` | `#E8C19A` | Gold hover |
| `accentDark` | `rgba(212,165,116,0.15)` | Gold tinted backgrounds |
| `success` | `#3FB950` | Green — wins, BUY |
| `error` | `#F85149` | Red — losses, SELL, FBS |
| `warning` | `#D29922` | Yellow — ODF, warnings |
| `textPrimary` | `#F0F6FC` | Main text |
| `textSecondary` | `#A8B2BC` | Secondary text |
| `textMuted` | `#6E7681` | Muted text, labels |
| `border` | `#30363D` | Default borders |
| `borderLight` | `#3D444D` | Light borders |

### Typography
- Primary font: **Plus Jakarta Sans**
- Numbers/prices: **IBM Plex Mono**
- Display/hero: **DM Sans**
- Monospace: **JetBrains Mono**
- Font sizes: xs(12), sm(14), base(15), md(16), lg(18), xl(24), 2xl(32), 3xl(40), hero(56)

### Shadows
- No glow effects — solid shadows only (`sm`, `md`, `lg`, `xl`, `card`)

---

## 4) Navigation (`components/Layout.js`)

* Hamburger button on **left** side of header (44×44px, 3 lines)
* Slide-out menu from left (280px wide), `slideInFromLeft` animation (0.25s)
* Dark backdrop with blur when menu open
* Menu links: Dashboard, Analytics, History, Symbols, Timing, Optimize, Settings
* Header: hamburger | logo (48px) | spacer | live indicator (green dot + "Live") | version badge
* Paper/Live pill toggle in header

**ORB page removed from nav (2026-03-30)**

---

## 5) History Page (`pages/history.js`) — Updated 2026-03-30

### Strategy Column
Each trade row has a **Strategy** badge:
- `LLM Momentum` — green badge
- `Failed Breakout Short` (FBS) — red badge
- `Opening Drive Fade` (ODF) — gold/yellow badge

### Strategy Filter Pills
Filter bar above the table includes strategy pills:
- All | LLM Momentum | FBS | ODF

### API
`fetchTradeHistory(params)` now accepts a `strategy` filter parameter:
```javascript
fetchTradeHistory({ strategy: 'fbs', symbol: 'AMD', page: 1 })
```
Maps to `GET /api/analytics/history?strategy=fbs&symbol=AMD&page=1`

---

## 6) Settings Page (`pages/settings.js`)

### Two-Tier Settings Architecture
- **Flux settings** (from `defaults.py`): system defaults, backtest-optimized
- **Custom settings**: user overrides saved in Supabase

### Current Default Values (as of 2026-03-30)
| Setting | Default |
|---------|---------|
| `stop_loss_pct` | 0.008 (0.8%) |
| `take_profit_pct` | 0.015 (1.5%) |
| `max_hold_min` | 60 |
| `llm_conf_threshold` | 0.55 |
| `trading_window_start` | 11:30am EST |
| `trading_window_end` | 1:30pm EST |

### Tab Structure
- Profile → Safety → Risk → LLM Settings → (admin-only) Strategy

### ORB tab removed (2026-03-30)
The ORB settings tab and all ORB guardrails have been removed from settings.js.

---

## 7) API Client (`lib/api.js`)

All backend calls go through `fetchWithRetry()` with:
- 2 retries on network errors, 5xx, 429
- Exponential backoff (1–5s)
- Auto-refresh on 401

### Key Functions

| Function | Endpoint | Description |
|----------|----------|-------------|
| `fetchDashboardAnalytics()` | GET /api/analytics | Dashboard stats |
| `fetchSymbolAnalytics()` | GET /api/analytics/symbols | Per-symbol breakdown |
| `fetchTradeHistory(params)` | GET /api/analytics/history | Paginated history (accepts `strategy` param) |
| `fetchTimingAnalytics()` | GET /api/analytics/timing | Hour/day breakdown |
| `fetchSettings()` / `saveSettings()` | GET/POST /api/settings | Admin settings |
| `fetchUserSettings()` / `saveUserSettings()` | GET/POST /api/user/settings | User settings |
| `fetchFluxSettings()` | GET /api/user/flux-settings | Backtest-optimized saved settings |
| `fetchPresets()` / `applyPreset()` | GET /api/presets / POST /api/user/preset | Presets |
| `fetchGuardrails()` | GET /api/settings/guardrails | Validation rules |
| `fetchAccountSummary()` | GET /api/account/summary | Account + today P&L |
| `runBacktest(params)` | POST /api/user/backtest | Backtest comparison |
| `runCycleReplay(params)` | POST /api/backtest/replay | What-if analysis |
| `runOptimization(params)` | POST /api/backtest/optimize | Grid search optimizer |
| `fetchStrategies()` | GET /api/strategies | Available strategies |
| `setActiveStrategy(strategy)` | POST /api/strategies/active | Change strategy (admin) |
| `fetchSubscriptionLimits()` | GET /api/user/subscription/limits | Subscription status |

---

## 8) Important Rules (Claude must follow)

### 1) Match backend field names exactly
Frontend must use the exact field names from API responses:
- Timing: `trades` (not `trade_count`), `pnl` (not `total_pnl`), `day` (not `day_of_week`)
- Symbols: `trade_count`, `total_pnl`, `win_rate`, `avg_pnl`, `avg_hold_min`, `best_trade`, `worst_trade`, `sparkline`
- Settings: use `llm_conf_threshold` (not `conf_threshold`) in new code

### 2) SSR safety
Always check `typeof window !== 'undefined'` before accessing `localStorage`, `document`, or `window.matchMedia`.

### 3) Helper components outside main function
Components like `Toast`, `ReadOnlyValue`, `SettingsSection` defined outside the main page function CANNOT access local variables. Always pass `colors` as a prop with default: `function MyComponent({ colors = darkTheme })`.

### 4) No ORB code ever
Never re-add the ORB page, ORB settings tab, or any ORB-related UI. ORB was removed on 2026-03-30 and is fully deprecated.

### 5) Settings fallbacks must use `defaults.py` values
Settings fallbacks in the frontend must match the values in `app/defaults.py` on the backend. Keep them in sync when defaults change.

### 6) Strategy badges use specific colors
- LLM Momentum: `colors.success` (green)
- FBS: `colors.error` (red)
- ODF: `colors.warning` (gold/yellow)

Do not change these color assignments.

---

## 9) Recent Changes

### 2026-03-30
1. **ORB page and references removed**: Deleted `pages/orb.js`, `pages/tickers.js`, all ORB-related settings fields and nav links
2. **Settings fallbacks synced**: Frontend fallback values updated to match `defaults.py` (SL=0.008, TP=0.015, conf=0.55, window=11:30am–1:30pm EST)
3. **History page: Strategy column added**: Color-coded badges for LLM Momentum (green), FBS (red), ODF (gold)
4. **History page: Strategy filter pills**: Filter by strategy above the trade table
5. **`fetchTradeHistory` updated**: Now accepts `strategy` filter param

### Earlier changes (key milestones)
- 2026-03-02: Flux Settings card on optimize page; saved backtest results persist on reload
- 2026-02-24: HTF analysis settings added to settings page
- 2026-02-11: ORB ticker state dashboard (now removed)
- 2026-02-09: Strategy selector UI in settings (ORB/Momentum/LLM); ORB tab
- 2026-01-30: Trailing stop settings section; Admin settings + dynamic balanced preset
- 2026-01-29: Landing page; Dark Luxe theme; auth protection in Layout.js
- 2026-01-28: Analytics pages (analytics.js, history.js, symbols.js, timing.js)
- 2026-01-27: Design system (theme.js), hamburger nav, logo

---

## 10) Common Errors & Lessons Learned

### Static files must be in `public/`
Next.js only serves static files from `public/`. Images must be at `public/images/`.

### Animation name conflicts
Named CSS animations must be unique across all components. Use descriptive names like `slideInFromLeft` not just `slideIn`.

### Auth state in conditional rendering
```js
const { user, loading } = useAuth();
if (loading) return <Spinner />;
if (!user) return <LandingPage />;
return <Dashboard />;
```
Not checking `loading` causes flicker.

### Theme: no gradients or glows
The "Dark Luxe" theme uses solid shadows only. Do not add gradient text, box-shadow glows, or neon effects.
