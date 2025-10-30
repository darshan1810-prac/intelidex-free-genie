import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LSTMPrediction {
  date: string;
  day: number;
  signal: "BUY" | "SELL";
  probability: number;
  confidence: number;
  close_price: number;
  indicators: {
    rsi: number;
    macd: number;
    macd_hist: number;
    bb_position: number;
    trend_strength: number;
    volume_ratio: number;
    stochastic: number;
    atr_pct: number;
    return_7d: number;
    price: number;
  };
}

export const useLSTMPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<LSTMPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePredictions = async (
    symbol: string,
    startDate?: string,
    periods: number = 14
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "lstm-predictions",
        {
          body: { symbol, startDate, periods },
        }
      );

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || "Prediction failed");

      setPredictions(data.predictions);
      return data.predictions;
    } catch (e: any) {
      const errorMsg = e.message || "Failed to generate predictions";
      setError(errorMsg);
      console.error("LSTM prediction error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    predictions,
    loading,
    error,
    generatePredictions,
  };
};
