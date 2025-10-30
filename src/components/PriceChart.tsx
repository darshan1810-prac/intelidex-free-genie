import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, Activity, BarChart3, Download, Calendar } from "lucide-react";
import { calculateEMA, calculateRSI, calculateVWAP } from "@/utils/technicalIndicators";
import { useBinanceKlines } from "@/hooks/useBinanceData";
import { exportToCSV } from "@/utils/csvExport";
import { toast } from "sonner";

interface PriceChartProps {
  data: Array<{ timestamp: number; price: number }>;
  volumes: Array<{ timestamp: number; volume: number }>;
  coinName: string;
}

export const PriceChart = ({ data, volumes, coinName }: PriceChartProps) => {
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const symbol = coinName === "Bitcoin" ? "BTCUSDT" : "ETHUSDT";
  const { data: binanceData } = useBinanceKlines(symbol, "1h", 168);

  const handleExportCSV = () => {
    if (binanceData) {
      exportToCSV(binanceData, symbol, startDate, endDate);
      toast.success("CSV exported successfully");
    }
  };

  const prices = data.map((d) => d.price);
  const volumeData = volumes.map((v) => v.volume);

  const ema = calculateEMA(prices, 20);
  const rsi = calculateRSI(prices, 14);
  const vwap = calculateVWAP(prices, volumeData);

  const chartData = data.map((point, idx) => ({
    time: new Date(point.timestamp).toLocaleDateString(),
    price: point.price,
    ema: ema[idx - (data.length - ema.length)] || null,
    rsi: rsi[idx - (data.length - rsi.length)] || null,
    vwap: vwap[idx] || null,
  }));

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {coinName} Price Chart
          </CardTitle>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant={showEMA ? "default" : "outline"}
              size="sm"
              onClick={() => setShowEMA(!showEMA)}
            >
              EMA
            </Button>
            <Button
              variant={showRSI ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRSI(!showRSI)}
            >
              RSI
            </Button>
            <Button
              variant={showVWAP ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVWAP(!showVWAP)}
            >
              VWAP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
            {showEMA && (
              <Line
                type="monotone"
                dataKey="ema"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                name="EMA (20)"
              />
            )}
            {showVWAP && (
              <Line
                type="monotone"
                dataKey="vwap"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                dot={false}
                name="VWAP"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {showRSI && (
          <ResponsiveContainer width="100%" height={150} className="mt-4">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                name="RSI (14)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
