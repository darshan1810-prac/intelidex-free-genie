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
