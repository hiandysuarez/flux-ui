// lib/tickers.js - ORB Strategy Ticker Configuration

/**
 * Default tickers for ORB strategy
 * 20 tickers across categories: Tech, ETF, Finance, Energy, Consumer, Healthcare
 */
export const DEFAULT_TICKERS = [
  // Tech (7)
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'tech', enabled: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'tech', enabled: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'tech', enabled: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'tech', enabled: true },
  { symbol: 'META', name: 'Meta Platforms', category: 'tech', enabled: true },
  { symbol: 'AMZN', name: 'Amazon.com', category: 'tech', enabled: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'tech', enabled: true },

  // ETFs (3)
  { symbol: 'SPY', name: 'S&P 500 ETF', category: 'etf', enabled: true },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', category: 'etf', enabled: true },
  { symbol: 'IWM', name: 'Russell 2000 ETF', category: 'etf', enabled: true },

  // Finance (2)
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'finance', enabled: true },
  { symbol: 'BAC', name: 'Bank of America', category: 'finance', enabled: true },

  // Energy (2)
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'energy', enabled: true },
  { symbol: 'CVX', name: 'Chevron Corp.', category: 'energy', enabled: true },

  // Consumer (2)
  { symbol: 'WMT', name: 'Walmart Inc.', category: 'consumer', enabled: true },
  { symbol: 'HD', name: 'Home Depot', category: 'consumer', enabled: true },

  // Healthcare (2)
  { symbol: 'UNH', name: 'UnitedHealth', category: 'healthcare', enabled: true },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'healthcare', enabled: true },

  // Additional Tech (2)
  { symbol: 'AMD', name: 'AMD Inc.', category: 'tech', enabled: true },
  { symbol: 'CRM', name: 'Salesforce', category: 'tech', enabled: true },
];

/**
 * Category colors matching Dark Luxe theme
 */
export const CATEGORY_COLORS = {
  tech: '#D4A574',      // Gold/accent
  etf: '#3FB950',       // Green
  finance: '#58A6FF',   // Blue
  energy: '#F85149',    // Red
  consumer: '#A371F7',  // Purple
  healthcare: '#79C0FF', // Light blue
  custom: '#6E7681',    // Gray
};

/**
 * Category display labels
 */
export const CATEGORY_LABELS = {
  tech: 'Technology',
  etf: 'ETFs',
  finance: 'Finance',
  energy: 'Energy',
  consumer: 'Consumer',
  healthcare: 'Healthcare',
  custom: 'Custom',
};

/**
 * ORB state colors for status display
 */
export const ORB_STATE_COLORS = {
  WAITING_FOR_OPEN: '#6E7681',   // Gray - waiting
  FORMING_RANGE: '#D4A574',      // Gold - active
  RANGE_SET: '#58A6FF',          // Blue - ready
  BREAK_DETECTED: '#F0883E',     // Orange - alert
  WAITING_FOR_RETEST: '#A371F7', // Purple - watching
  SETUP_READY: '#3FB950',        // Green - tradeable
  TRADED: '#238636',             // Dark green - completed
  EXPIRED: '#6E7681',            // Gray - done
};

/**
 * ORB state display labels
 */
export const ORB_STATE_LABELS = {
  WAITING_FOR_OPEN: 'Waiting',
  FORMING_RANGE: 'Forming',
  RANGE_SET: 'Range Set',
  BREAK_DETECTED: 'Break!',
  WAITING_FOR_RETEST: 'Retest',
  SETUP_READY: 'Ready',
  TRADED: 'Traded',
  EXPIRED: 'Expired',
};
