import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface TradingSignal {
  id: string;
  symbol: string;
  signal_type: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string;
  target_price_pct: number;
  stop_loss_pct: number;
  source: string;
  article_count: number;
  sentiment_score: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export const useTradingSignals = (activeOnly = true, symbolFilter?: string) => {
  const query = useQuery({
    queryKey: ["trading-signals", activeOnly, symbolFilter],
    queryFn: async () => {
      let query = supabase
        .from("trading_signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      if (symbolFilter) {
        query = query.eq("symbol", symbolFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as unknown) as TradingSignal[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("trading-signals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trading_signals",
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return query;
};
