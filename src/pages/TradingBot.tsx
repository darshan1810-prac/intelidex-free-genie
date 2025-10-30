import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Download, Activity } from "lucide-react";
import { useLSTMPredictions, type LSTMPrediction } from "@/hooks/useLSTMPredictions";
import { useBinanceTopSymbols } from "@/hooks/useBinanceData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TradingBot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [startDate, setStartDate] = useState("");
  const [periods, setPeriods] = useState("14");
  const [useLatest, setUseLatest] = useState(true);
  const [interval, setInterval] = useState("1h");
  const [timeFrame, setTimeFrame] = useState("1w");
  
  const { data: topSymbols } = useBinanceTopSymbols();
  const { predictions, loading, error, generatePredictions } = useLSTMPredictions();

  const intervals = [
    { value: "1m", label: "1 min" },
    { value: "5m", label: "5 min" },
    { value: "15m", label: "15 min" },
    { value: "30m", label: "30 min" },
    { value: "1h", label: "1 hour" },
    { value: "4h", label: "4 hours" },
    { value: "1d", label: "1 day" },
    { value: "1w", label: "1 week" },
  ];

  const timeFrames = [
    { value: "1d", label: "1 Day" },
    { value: "1w", label: "1 Week" },
    { value: "1M", label: "1 Month" },
    { value: "3M", label: "3 Months" },
    { value: "6M", label: "6 Months" },
    { value: "1y", label: "1 Year" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePredict = async () => {
    const periodsNum = parseInt(periods);
    if (periodsNum < 1 || periodsNum > 30) {
      toast({
        title: "Invalid periods",
        description: "Please enter a value between 1 and 30",
        variant: "destructive",
      });
      return;
    }

    const result = await generatePredictions(
      symbol,
      useLatest ? undefined : startDate,
      periodsNum,
      interval
    );

    if (result) {
      toast({
        title: "Predictions generated",
        description: `Generated ${result.length} predictions for ${symbol}`,
      });
    } else if (error) {
      toast({
        title: "Prediction failed",
        description: error,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (predictions.length === 0) return;

    const headers = [
      "Period", "Date", "Signal", "Probability", "Confidence", 
      "Price", "Upper Bound", "Lower Bound",
      "RSI", "MACD", "MACD Hist", "BB Position", "Trend Strength",
      "Volume Ratio", "Stochastic", "ATR %", "Return 7d"
    ];

    const rows = predictions.map((pred: LSTMPrediction) => [
      pred.day,
      new Date(pred.date).toISOString(),
      pred.signal,
      (pred.probability * 100).toFixed(2),
      (pred.confidence * 100).toFixed(2),
      pred.close_price.toFixed(2),
      pred.upper_bound?.toFixed(2) || "",
      pred.lower_bound?.toFixed(2) || "",
      pred.indicators.rsi.toFixed(2),
      pred.indicators.macd.toFixed(4),
      pred.indicators.macd_hist.toFixed(4),
      pred.indicators.bb_position.toFixed(4),
      pred.indicators.trend_strength.toFixed(2),
      pred.indicators.volume_ratio.toFixed(2),
      pred.indicators.stochastic.toFixed(2),
      pred.indicators.atr_pct.toFixed(2),
      pred.indicators.return_7d.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${symbol}_predictions_${interval}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: "Predictions exported successfully",
    });
  };

  const getSignalColor = (signal: string) => {
    return signal === "BUY" ? "text-green-500" : "text-red-500";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-500";
    if (confidence >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">LSTM Trading Bot</h1>
            <p className="text-muted-foreground">AI-powered spot trading predictions</p>
          </div>
          <Button onClick={() => navigate("/paper-trading")} variant="outline">
            Paper Trading
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Trading Symbol</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger id="symbol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topSymbols?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periods">Prediction Periods</Label>
                <Input
                  id="periods"
                  type="number"
                  min="1"
                  max="30"
                  value={periods}
                  onChange={(e) => setPeriods(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Time Frame (Duration from Start Date)</Label>
              <div className="flex flex-wrap gap-2">
                {timeFrames.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={timeFrame === tf.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFrame(tf.value)}
                    className={cn(
                      "transition-all",
                      timeFrame === tf.value && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Interval (Candle Size)</Label>
              <div className="flex flex-wrap gap-2">
                {intervals.map((int) => (
                  <Button
                    key={int.value}
                    variant={interval === int.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInterval(int.value)}
                    className={cn(
                      "transition-all",
                      interval === int.value && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {int.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="latest"
                  checked={useLatest}
                  onChange={() => setUseLatest(true)}
                  className="cursor-pointer"
                />
                <Label htmlFor="latest" className="cursor-pointer">Use Latest Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="historical"
                  checked={!useLatest}
                  onChange={() => setUseLatest(false)}
                  className="cursor-pointer"
                />
                <Label htmlFor="historical" className="cursor-pointer">Historical Date</Label>
              </div>
            </div>

            {!useLatest && (
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            <Button onClick={handlePredict} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Predictions...
                </>
              ) : (
                "Generate Predictions"
              )}
            </Button>
          </CardContent>
        </Card>

        {predictions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Predictions for {symbol} ({interval} interval)</CardTitle>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Period</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Signal</th>
                      <th className="text-left p-2">Probability</th>
                      <th className="text-left p-2">Confidence</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Upper Bound</th>
                      <th className="text-right p-2">Lower Bound</th>
                      <th className="text-right p-2">Risk/Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred: LSTMPrediction, idx: number) => {
                      const riskReward = pred.upper_bound && pred.lower_bound 
                        ? ((pred.upper_bound - pred.close_price) / (pred.close_price - pred.lower_bound)).toFixed(2)
                        : "N/A";
                      
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono">{pred.day}</td>
                          <td className="p-2 font-mono text-sm">
                            {new Date(pred.date).toLocaleString()}
                          </td>
                          <td className={`p-2 font-bold ${getSignalColor(pred.signal)}`}>
                            <div className="flex items-center gap-1">
                              {pred.signal === "BUY" ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {pred.signal}
                            </div>
                          </td>
                          <td className="p-2">{(pred.probability * 100).toFixed(1)}%</td>
                          <td className={`p-2 font-semibold ${getConfidenceColor(pred.confidence)}`}>
                            {(pred.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 text-right font-mono">
                            ${pred.close_price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-right font-mono text-green-500">
                            {pred.upper_bound ? `$${pred.upper_bound.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}` : "N/A"}
                          </td>
                          <td className="p-2 text-right font-mono text-red-500">
                            {pred.lower_bound ? `$${pred.lower_bound.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}` : "N/A"}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {riskReward}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {predictions.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Advanced Technical Analysis (Latest Period)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {predictions[predictions.length - 1]?.indicators && Object.entries(predictions[predictions.length - 1].indicators).map(([key, value]) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    let colorClass = "text-foreground";
                    
                    // Add color coding based on indicator values
                    if (key === "rsi") {
                      if (numValue > 70) colorClass = "text-red-500";
                      else if (numValue < 30) colorClass = "text-green-500";
                      else colorClass = "text-yellow-500";
                    } else if (key === "trend_strength") {
                      if (numValue > 5) colorClass = "text-green-500";
                      else if (numValue < -5) colorClass = "text-red-500";
                    } else if (key === "bb_position") {
                      if (numValue > 0.8) colorClass = "text-red-500";
                      else if (numValue < 0.2) colorClass = "text-green-500";
                    }
                    
                    return (
                      <div key={key} className="space-y-1 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                        <p className={`text-xl font-bold ${colorClass}`}>
                          {typeof value === 'number' ? value.toFixed(4) : value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Overall Bias</p>
                      <p className="text-2xl font-bold">
                        {predictions.filter(p => p.signal === "BUY").length > predictions.length / 2 
                          ? "🟢 BULLISH" 
                          : "🔴 BEARISH"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Avg Confidence</p>
                      <p className="text-2xl font-bold">
                        {(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Signal Strength</p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const buyCount = predictions.filter(p => p.signal === "BUY").length;
                          const ratio = Math.abs((buyCount / predictions.length) - 0.5) * 2;
                          if (ratio > 0.7) return "🟢 STRONG";
                          if (ratio > 0.4) return "🟡 MODERATE";
                          return "🔴 WEAK";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TradingBot;
