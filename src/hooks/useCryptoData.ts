import { useQuery } from "@tanstack/react-query";
import type { CryptoAsset } from "@/types/crypto";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export const useCryptoData = (refreshInterval: number = 30000) => {
  return useQuery({
    queryKey: ["crypto-assets"],
    queryFn: async (): Promise<CryptoAsset[]> => {
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch crypto data");
      }
      
      return response.json();
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
  });
};

export const useCryptoChart = (coinId: string, days: number = 7) => {
  return useQuery({
    queryKey: ["crypto-chart", coinId, days],
    queryFn: async () => {
      const response = await fetch(
        `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch chart data");
      }
      
      const data = await response.json();
      return {
        prices: data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price,
        })),
        volumes: data.total_volumes.map(([timestamp, volume]: [number, number]) => ({
          timestamp,
          volume,
        })),
      };
    },
    refetchInterval: 60000,
  });
};
