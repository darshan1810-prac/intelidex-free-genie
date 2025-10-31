import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BinanceKline } from "@/hooks/useBinanceData";
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
} from "@/utils/technicalIndicators";
import { format } from "date-fns";

interface IndicatorChartsProps {
  data: BinanceKline[];
}

export const IndicatorCharts = ({ data }: IndicatorChartsProps) => {
  const closes = data.map((k) => parseFloat(k.close));
  const highs = data.map((k) => parseFloat(k.high));
  const lows = data.map((k) => parseFloat(k.low));
  const volumes = data.map((k) => parseFloat(k.volume));

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);
  const stochastic = calculateStochastic(highs, lows, closes);
  const atr = calculateATR(highs, lows, closes);

  // Prepare chart data
  const rsiData = rsi.map((value, idx) => ({
    timestamp: format(
      new Date(data[data.length - rsi.length + idx].openTime),
      "MM/dd HH:mm"
    ),
    rsi: value,
  }));

  const macdData = macd.histogram.map((value, idx) => ({
    timestamp: format(
      new Date(data[data.length - macd.histogram.length + idx].openTime),
      "MM/dd HH:mm"
    ),
    macd: macd.macd[macd.macd.length - macd.histogram.length + idx],
    signal: macd.signal[idx],
    histogram: value,
  }));

  const bbData = bb.middle.map((value, idx) => ({
    timestamp: format(
      new Date(data[data.length - bb.middle.length + idx].openTime),
      "MM/dd HH:mm"
    ),
    close: closes[data.length - bb.middle.length + idx],
    upper: bb.upper[idx],
    middle: value,
    lower: bb.lower[idx],
  }));

  const stochasticData = stochastic.d.map((value, idx) => ({
    timestamp: format(
      new Date(data[data.length - stochastic.d.length + idx].openTime),
      "MM/dd HH:mm"
    ),
    k: stochastic.k[stochastic.k.length - stochastic.d.length + idx],
    d: value,
  }));

  const volumeData = data.slice(-50).map((k) => ({
    timestamp: format(new Date(k.openTime), "MM/dd HH:mm"),
    volume: parseFloat(k.volume),
  }));

  return (
    <div className="space-y-6">
      {/* RSI Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Relative Strength Index (RSI-14)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rsiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-muted-foreground">
            Overbought (&gt;70) | Oversold (&lt;30) | Current: {rsi[rsi.length - 1]?.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* MACD Chart */}
      <Card>
        <CardHeader>
          <CardTitle>MACD (12, 26, 9)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={macdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="histogram" fill="hsl(var(--primary))" />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bollinger Bands */}
      <Card>
        <CardHeader>
          <CardTitle>Bollinger Bands (20, 2)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bbData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="upper"
                stroke="hsl(var(--destructive))"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="middle"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lower"
                stroke="hsl(var(--success))"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stochastic Oscillator */}
      <Card>
        <CardHeader>
          <CardTitle>Stochastic Oscillator (14, 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stochasticData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend />
              <ReferenceLine y={80} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <ReferenceLine y={20} stroke="hsl(var(--success))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="k"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="%K"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="d"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="%D"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Volume Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar dataKey="volume" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
