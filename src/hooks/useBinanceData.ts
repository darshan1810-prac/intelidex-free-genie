import { useQuery } from "@tanstack/react-query";

const BINANCE_API = "https://api.binance.com/api/v3";

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export const useBinanceKlines = (
  symbol: string = "BTCUSDT",
  interval: string = "1h",
  limit: number = 168
) => {
  return useQuery({
    queryKey: ["binance-klines", symbol, interval, limit],
    queryFn: async (): Promise<BinanceKline[]> => {
      const response = await fetch(
        `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch Binance data");
      }
      
      const data = await response.json();
      return data.map((k: any[]) => ({
        openTime: k[0],
        open: k[1],
        high: k[2],
        low: k[3],
        close: k[4],
        volume: k[5],
        closeTime: k[6],
      }));
    },
    refetchInterval: 60000,
  });
};

export const useBinancePrice = (symbol: string = "BTCUSDT") => {
  return useQuery({
    queryKey: ["binance-price", symbol],
    queryFn: async () => {
      const response = await fetch(
        `${BINANCE_API}/ticker/24hr?symbol=${symbol}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch price data");
      }
      
      return response.json();
    },
    refetchInterval: 5000,
  });
};

export const useBinanceTopSymbols = () => {
  return useQuery<string[]>({
    queryKey: ["binance-top-symbols"],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch(
        `${BINANCE_API}/ticker/24hr`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch symbols");
      }
      
      const data = await response.json();
      return data
        .filter((t: any) => t.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 50)
        .map((t: any) => t.symbol);
    },
    staleTime: 300000,
  });
};
