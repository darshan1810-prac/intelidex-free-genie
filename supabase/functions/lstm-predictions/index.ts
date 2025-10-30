import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, startDate, periods = 14, interval = "1h" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch historical data from Binance with specified interval
    const binanceData = await fetchBinanceData(symbol, periods + 100, interval);
    
    // Calculate all technical indicators
    const indicators = calculateIndicators(binanceData);
    
    // Generate predictions using AI with volatility bounds
    const predictions = await generatePredictions(indicators, startDate, periods, LOVABLE_API_KEY, interval);
    
    return new Response(JSON.stringify({ success: true, predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("LSTM prediction error:", e);
    const errorMsg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchBinanceData(symbol: string, limit: number, interval: string = "1h") {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return data.map((k: any) => ({
    date: new Date(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

function calculateIndicators(data: any[]) {
  const df = [...data];
  
  // Calculate SMAs
  addSMA(df, 7);
  addSMA(df, 14);
  addSMA(df, 21);
  addSMA(df, 50);
  
  // Calculate EMAs
  addEMA(df, 12);
  addEMA(df, 26);
  
  // Calculate RSI
  addRSI(df, 14);
  
  // Calculate MACD
  addMACD(df);
  
  // Calculate Bollinger Bands
  addBollingerBands(df, 20, 2);
  
  // Calculate ATR
  addATR(df, 14);
  
  // Calculate volume indicators
  addVolumeIndicators(df);
  
  // Calculate price patterns
  addPricePatterns(df);
  
  // Calculate Stochastic
  addStochastic(df, 14);
  
  // Calculate OBV
  addOBV(df);
  
  return df;
}

function addSMA(data: any[], period: number) {
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i][`sma_${period}`] = null;
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      data[i][`sma_${period}`] = sum / period;
    }
  }
}

function addEMA(data: any[], period: number) {
  const multiplier = 2 / (period + 1);
  let ema = data[period - 1]?.close || 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i][`ema_${period}`] = null;
    } else if (i === period - 1) {
      data[i][`ema_${period}`] = ema;
    } else {
      ema = (data[i].close - ema) * multiplier + ema;
      data[i][`ema_${period}`] = ema;
    }
  }
}

function addRSI(data: any[], period: number) {
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      data[i].rsi = null;
    } else {
      let gains = 0;
      let losses = 0;
      
      for (let j = 1; j <= period; j++) {
        const diff = data[i - period + j].close - data[i - period + j - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      data[i].rsi = 100 - (100 / (1 + rs));
    }
  }
}

function addMACD(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].ema_12 && data[i].ema_26) {
      data[i].macd = data[i].ema_12 - data[i].ema_26;
    } else {
      data[i].macd = null;
    }
  }
  
  // MACD Signal Line (9-period EMA of MACD)
  const macdValues = data.map(d => d.macd).filter(v => v !== null);
  const multiplier = 2 / 10;
  let signal = macdValues[8] || 0;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i].macd === null || i < 34) {
      data[i].macd_signal = null;
      data[i].macd_hist = null;
    } else if (i === 34) {
      data[i].macd_signal = signal;
      data[i].macd_hist = data[i].macd - signal;
    } else {
      signal = (data[i].macd - signal) * multiplier + signal;
      data[i].macd_signal = signal;
      data[i].macd_hist = data[i].macd - signal;
    }
  }
}

function addBollingerBands(data: any[], period: number, std_dev: number) {
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i].bb_upper = null;
      data[i].bb_lower = null;
      data[i].bb_width = null;
      data[i].bb_position = null;
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      const sma = sum / period;
      
      let variance = 0;
      for (let j = 0; j < period; j++) {
        variance += Math.pow(data[i - j].close - sma, 2);
      }
      const std = Math.sqrt(variance / period);
      
      data[i].bb_middle = sma;
      data[i].bb_upper = sma + (std * std_dev);
      data[i].bb_lower = sma - (std * std_dev);
      data[i].bb_width = ((data[i].bb_upper - data[i].bb_lower) / sma) * 100;
      data[i].bb_position = (data[i].close - data[i].bb_lower) / (data[i].bb_upper - data[i].bb_lower);
    }
  }
}

function addATR(data: any[], period: number) {
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      data[i].tr = data[i].high - data[i].low;
      data[i].atr = null;
    } else {
      const hl = data[i].high - data[i].low;
      const hc = Math.abs(data[i].high - data[i - 1].close);
      const lc = Math.abs(data[i].low - data[i - 1].close);
      data[i].tr = Math.max(hl, hc, lc);
      
      if (i < period) {
        data[i].atr = null;
      } else if (i === period) {
        let sum = 0;
        for (let j = 1; j <= period; j++) {
          sum += data[j].tr;
        }
        data[i].atr = sum / period;
      } else {
        data[i].atr = (data[i - 1].atr * (period - 1) + data[i].tr) / period;
      }
    }
    
    if (data[i].atr) {
      data[i].atr_pct = (data[i].atr / data[i].close) * 100;
    }
  }
}

function addVolumeIndicators(data: any[]) {
  // Volume SMA
  for (let i = 0; i < data.length; i++) {
    if (i < 19) {
      data[i].volume_sma = null;
      data[i].volume_ratio = null;
    } else {
      let sum = 0;
      for (let j = 0; j < 20; j++) {
        sum += data[i - j].volume;
      }
      data[i].volume_sma = sum / 20;
      data[i].volume_ratio = data[i].volume / data[i].volume_sma;
    }
  }
  
  // Volume normalization
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - 99);
    const window = data.slice(start, i + 1);
    const volumes = window.map(d => d.volume);
    const min = Math.min(...volumes);
    const max = Math.max(...volumes);
    data[i].volume_norm = (data[i].volume - min) / (max - min || 1);
  }
}

function addPricePatterns(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    // Returns
    data[i].return_1d = i > 0 ? ((data[i].close - data[i - 1].close) / data[i - 1].close) * 100 : null;
    data[i].return_3d = i > 2 ? ((data[i].close - data[i - 3].close) / data[i - 3].close) * 100 : null;
    data[i].return_7d = i > 6 ? ((data[i].close - data[i - 7].close) / data[i - 7].close) * 100 : null;
    
    // HL percentage
    data[i].hl_pct = ((data[i].high - data[i].low) / data[i].close) * 100;
    
    // Close position
    data[i].close_position = (data[i].close - data[i].low) / (data[i].high - data[i].low || 1);
    
    // Higher high / Lower low
    data[i].higher_high = i > 0 && data[i].high > data[i - 1].high ? 1 : 0;
    data[i].lower_low = i > 0 && data[i].low < data[i - 1].low ? 1 : 0;
  }
  
  // Trend strength
  for (let i = 0; i < data.length; i++) {
    if (data[i].sma_21) {
      data[i].trend_strength = ((data[i].close - data[i].sma_21) / data[i].sma_21) * 100;
    }
  }
}

function addStochastic(data: any[], period: number) {
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i].stochastic = null;
    } else {
      const window = data.slice(i - period + 1, i + 1);
      const low = Math.min(...window.map(d => d.low));
      const high = Math.max(...window.map(d => d.high));
      data[i].stochastic = ((data[i].close - low) / (high - low || 1)) * 100;
    }
  }
}

function addOBV(data: any[]) {
  data[0].obv = data[0].volume;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      data[i].obv = data[i - 1].obv + data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      data[i].obv = data[i - 1].obv - data[i].volume;
    } else {
      data[i].obv = data[i - 1].obv;
    }
  }
  
  // OBV SMA
  for (let i = 0; i < data.length; i++) {
    if (i < 19) {
      data[i].obv_sma = null;
    } else {
      let sum = 0;
      for (let j = 0; j < 20; j++) {
        sum += data[i - j].obv;
      }
      data[i].obv_sma = sum / 20;
    }
  }
}

async function generatePredictions(data: any[], startDate: string | null, periods: number, apiKey: string, interval: string = "1h") {
  const startIdx = startDate 
    ? data.findIndex(d => d.date.toISOString().split('T')[0] === startDate)
    : data.length - 21;
  
  if (startIdx < 21) throw new Error("Not enough historical data");
  
  const predictions = [];
  
  // Calculate ATR for volatility-based bounds
  const calculateVolatilityMultiplier = (interval: string): number => {
    const multipliers: Record<string, number> = {
      "1m": 0.5, "5m": 0.8, "15m": 1.0, "30m": 1.2,
      "1h": 1.5, "4h": 2.0, "1d": 2.5, "1w": 3.0
    };
    return multipliers[interval] || 1.5;
  };
  
  const volatilityMultiplier = calculateVolatilityMultiplier(interval);
  
  for (let i = 0; i < periods; i++) {
    const predIdx = startIdx + i;
    if (predIdx >= data.length) break;
    
    const window = data.slice(predIdx - 21, predIdx);
    const current = data[predIdx];
    
    // Calculate upper and lower bounds using ATR and volatility
    const atr = current.atr || 0;
    const upperBound = current.close + (atr * volatilityMultiplier);
    const lowerBound = current.close - (atr * volatilityMultiplier);
    
    // Prepare indicator summary for AI with enhanced technical depth
    const summary = {
      rsi: current.rsi,
      macd: current.macd,
      macd_hist: current.macd_hist,
      bb_position: current.bb_position,
      trend_strength: current.trend_strength,
      volume_ratio: current.volume_ratio,
      stochastic: current.stochastic,
      atr_pct: current.atr_pct,
      return_7d: current.return_7d,
      price: current.close,
    };
    
    // Enhanced AI prompt with more technical depth
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert algorithmic trading analyst specializing in technical analysis and quantitative strategies. 
            
Analyze the following key concepts:
1. RSI (Relative Strength Index): Momentum oscillator (0-100). <30 = oversold, >70 = overbought.
2. MACD: Trend-following momentum. Positive histogram = bullish momentum, negative = bearish.
3. Bollinger Bands Position: Price position within bands. >0.8 = near upper (potential reversal), <0.2 = near lower.
4. Stochastic: Momentum oscillator. <20 = oversold zone, >80 = overbought zone.
5. Volume Ratio: Current volume vs average. >1.5 = high volume (strong signal).
6. Trend Strength: % deviation from MA. >5% = strong uptrend, <-5% = strong downtrend.

Consider confluence of multiple indicators. High confidence signals require 3+ indicators aligning.
Respond ONLY with JSON: {"signal":"BUY" or "SELL","probability":0.0-1.0,"confidence":0.0-1.0}

Confidence calculation:
- High (0.7-1.0): 4+ indicators align + high volume
- Medium (0.5-0.7): 2-3 indicators align
- Low (0.0-0.5): Mixed signals or single indicator`
          },
          {
            role: "user",
            content: `Interval: ${interval}
Technical Analysis:

MOMENTUM INDICATORS:
- RSI: ${summary.rsi?.toFixed(2)} ${summary.rsi < 30 ? '(OVERSOLD)' : summary.rsi > 70 ? '(OVERBOUGHT)' : '(NEUTRAL)'}
- Stochastic: ${summary.stochastic?.toFixed(2)} ${summary.stochastic < 20 ? '(OVERSOLD)' : summary.stochastic > 80 ? '(OVERBOUGHT)' : '(NEUTRAL)'}
- 7-Day Return: ${summary.return_7d?.toFixed(2)}%

TREND INDICATORS:
- Trend Strength: ${summary.trend_strength?.toFixed(2)}% ${Math.abs(summary.trend_strength) > 5 ? '(STRONG)' : '(WEAK)'}
- MACD: ${summary.macd?.toFixed(4)}
- MACD Histogram: ${summary.macd_hist?.toFixed(4)} ${summary.macd_hist > 0 ? '(BULLISH)' : '(BEARISH)'}

VOLATILITY & VOLUME:
- BB Position: ${summary.bb_position?.toFixed(2)} (0=lower band, 1=upper band)
- ATR %: ${summary.atr_pct?.toFixed(2)}% (volatility measure)
- Volume Ratio: ${summary.volume_ratio?.toFixed(2)}x ${summary.volume_ratio > 1.5 ? '(HIGH VOLUME)' : '(NORMAL)'}

Current Price: $${summary.price?.toFixed(2)}
Volatility Bounds: $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}

Provide BUY/SELL signal with probability and confidence.`
          }
        ],
      }),
    });
    
    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    let decision;
    
    try {
      decision = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    } catch {
      decision = { signal: "SELL", probability: 0.5, confidence: 0.5 };
    }
    
    predictions.push({
      date: current.date,
      day: i + 1,
      signal: decision.signal,
      probability: decision.probability || 0.5,
      confidence: decision.confidence || 0.5,
      close_price: current.close,
      upper_bound: upperBound,
      lower_bound: lowerBound,
      indicators: summary,
    });
  }
  
  return predictions;
}
