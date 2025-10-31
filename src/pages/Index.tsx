import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, RefreshCw, User, TestTube, TrendingUp, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBinanceKlines, useBinanceTopSymbols } from "@/hooks/useBinanceData";
import { useSettings } from "@/hooks/useSettings";
import { OHLCVTable } from "@/components/OHLCVTable";
import { IndicatorCharts } from "@/components/IndicatorCharts";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const TIME_FRAMES = [
  { label: "1 Day", value: "1", days: 1 },
  { label: "1 Week", value: "7", days: 7 },
  { label: "1 Month", value: "30", days: 30 },
  { label: "3 Months", value: "90", days: 90 },
  { label: "6 Months", value: "180", days: 180 },
  { label: "1 Year", value: "365", days: 365 },
];

const INTERVALS = [
  { label: "1 min", value: "1m" },
  { label: "5 min", value: "5m" },
  { label: "15 min", value: "15m" },
  { label: "30 min", value: "30m" },
  { label: "1 hour", value: "1h" },
  { label: "4 hours", value: "4h" },
  { label: "1 day", value: "1d" },
  { label: "1 week", value: "1w" },
];

const Index = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeFrame, setTimeFrame] = useState("7");
  const [interval, setInterval] = useState("1h");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: topSymbols } = useBinanceTopSymbols();
  
  const calculateLimit = () => {
    const days = TIME_FRAMES.find((tf) => tf.value === timeFrame)?.days || 7;
    const intervalMap: Record<string, number> = {
      "1m": days * 1440,
      "5m": days * 288,
      "15m": days * 96,
      "30m": days * 48,
      "1h": days * 24,
      "4h": days * 6,
      "1d": days,
      "1w": Math.ceil(days / 7),
    };
    return Math.min(intervalMap[interval] || 168, 1000);
  };

  const { data: binanceData, isLoading, refetch } = useBinanceKlines(
    selectedSymbol,
    interval,
    calculateLimit()
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (shouldFetch) {
      refetch();
      setShouldFetch(false);
    }
  }, [shouldFetch, refetch]);

  const handleGenerate = () => {
    setShouldFetch(true);
    toast.success("Generating chart and data...");
  };

  const chartData = binanceData?.map((k) => ({
    timestamp: format(new Date(k.openTime), "MM/dd HH:mm"),
    price: parseFloat(k.close),
    volume: parseFloat(k.volume),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time cryptocurrency data from Binance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="outline" onClick={() => navigate("/paper-trading")}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Paper Trading
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/trading-bot")}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    LSTM Bot
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/news-analysis")}>
                    <Newspaper className="w-4 h-4 mr-2" />
                    News Analysis
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/news-analysis")}>
                    <Newspaper className="w-4 h-4 mr-2" />
                    News Analysis
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/auth")}>
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Controls Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cryptocurrency Selector */}
                <div className="space-y-2">
                  <Label>Cryptocurrency</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {topSymbols?.slice(0, 20).map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the starting date for your analysis
                  </p>
                </div>

                {/* Time Frame */}
                <div className="space-y-2">
                  <Label>Time Frame (Duration from Start Date)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_FRAMES.map((tf) => (
                      <Button
                        key={tf.value}
                        variant={timeFrame === tf.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeFrame(tf.value)}
                      >
                        {tf.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interval */}
                <div className="space-y-2">
                  <Label>Interval (Candle Size)</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERVALS.map((int) => (
                      <Button
                        key={int.value}
                        variant={interval === int.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setInterval(int.value)}
                      >
                        {int.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Generate Chart & Data"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Price Chart */}
          {binanceData && chartData && (
            <Card>
              <CardHeader>
                <CardTitle>Price Chart - {selectedSymbol}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      yAxisId="price"
                      orientation="left"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      yAxisId="volume"
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="price"
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={1}
                      dot={false}
                      yAxisId="volume"
                      opacity={0.3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* OHLCV Table */}
          {binanceData && <OHLCVTable data={binanceData} symbol={selectedSymbol} />}

          {/* Technical Indicators */}
          {binanceData && binanceData.length > 50 && (
            <>
              <div className="pt-4">
                <h2 className="text-2xl font-bold mb-4">Technical Indicators</h2>
              </div>
              <IndicatorCharts data={binanceData} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
