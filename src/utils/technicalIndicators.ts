export const calculateEMA = (data: number[], period: number = 20): number[] => {
  if (data.length < period) return [];
  
  const k = 2 / (period + 1);
  const ema: number[] = [];
  
  // Start with SMA for first value
  const sma = data.slice(0, period).reduce((a, b) => a + b) / period;
  ema.push(sma);
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const value = data[i] * k + ema[ema.length - 1] * (1 - k);
    ema.push(value);
  }
  
  return ema;
};

export const calculateRSI = (data: number[], period: number = 14): number[] => {
  if (data.length < period + 1) return [];
  
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  
  // Calculate RSI
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
};

export const calculateVWAP = (prices: number[], volumes: number[]): number[] => {
  if (prices.length !== volumes.length) return [];
  
  const vwap: number[] = [];
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < prices.length; i++) {
    cumulativePV += prices[i] * volumes[i];
    cumulativeVolume += volumes[i];
    vwap.push(cumulativePV / cumulativeVolume);
  }
  
  return vwap;
};

export const calculateCorrelation = (data1: number[], data2: number[]): number => {
  if (data1.length !== data2.length || data1.length === 0) return 0;
  
  const n = data1.length;
  const mean1 = data1.reduce((a, b) => a + b) / n;
  const mean2 = data2.reduce((a, b) => a + b) / n;
  
  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
};

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export const calculateMACD = (
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine: number[] = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length);
  
  for (let i = 0; i < minLength; i++) {
    macdLine.push(fastEMA[fastEMA.length - minLength + i] - slowEMA[slowEMA.length - minLength + i]);
  }
  
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram: number[] = [];
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[macdLine.length - signalLine.length + i] - signalLine[i]);
  }
  
  return { macd: macdLine, signal: signalLine, histogram };
};

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export const calculateBollingerBands = (
  data: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult => {
  if (data.length < period) return { upper: [], middle: [], lower: [] };
  
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b) / period;
    middle.push(sma);
    
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upper.push(sma + stdDev * std);
    lower.push(sma - stdDev * std);
  }
  
  return { upper, middle, lower };
};

export interface StochasticResult {
  k: number[];
  d: number[];
}

export const calculateStochastic = (
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult => {
  if (highs.length < kPeriod || highs.length !== lows.length || highs.length !== closes.length) {
    return { k: [], d: [] };
  }
  
  const k: number[] = [];
  
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
    const periodLows = lows.slice(i - kPeriod + 1, i + 1);
    
    const highestHigh = Math.max(...periodHighs);
    const lowestLow = Math.min(...periodLows);
    
    const kValue = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
    k.push(kValue);
  }
  
  const d: number[] = [];
  for (let i = dPeriod - 1; i < k.length; i++) {
    const sum = k.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b);
    d.push(sum / dPeriod);
  }
  
  return { k, d };
};

export const calculateATR = (
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] => {
  if (highs.length < 2 || highs.length !== lows.length || highs.length !== closes.length) {
    return [];
  }
  
  const tr: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
  }
  
  const atr: number[] = [];
  let sum = tr.slice(0, period).reduce((a, b) => a + b);
  atr.push(sum / period);
  
  for (let i = period; i < tr.length; i++) {
    const value = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(value);
  }
  
  return atr;
};
