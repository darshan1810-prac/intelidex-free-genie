export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema: number[];
  rsi: number[];
  vwap: number[];
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
}

export interface CorrelationData {
  coin1: string;
  coin2: string;
  correlation: number;
}

export interface UserSettings {
  favoriteCoins: string[];
  refreshInterval: number;
  theme: "dark" | "light";
}
