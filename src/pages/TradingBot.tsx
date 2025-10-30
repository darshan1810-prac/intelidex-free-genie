import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useLSTMPredictions, type LSTMPrediction } from "@/hooks/useLSTMPredictions";
import { useBinanceTopSymbols } from "@/hooks/useBinanceData";
import { useToast } from "@/hooks/use-toast";

const TradingBot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [startDate, setStartDate] = useState("");
  const [periods, setPeriods] = useState("14");
  const [useLatest, setUseLatest] = useState(true);
  
  const { data: topSymbols } = useBinanceTopSymbols();
  const { predictions, loading, error, generatePredictions } = useLSTMPredictions();

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
      periodsNum
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
          <CardContent className="space-y-4">
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
            <CardHeader>
              <CardTitle>Predictions for {symbol}</CardTitle>
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
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred: LSTMPrediction, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{pred.day}</td>
                        <td className="p-2 font-mono text-sm">
                          {new Date(pred.date).toLocaleString()}
                        </td>
                        <td className={`p-2 font-bold flex items-center gap-1 ${getSignalColor(pred.signal)}`}>
                          {pred.signal === "BUY" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {pred.signal}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {predictions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators (Latest)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {predictions[predictions.length - 1]?.indicators && Object.entries(predictions[predictions.length - 1].indicators).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-semibold">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradingBot;
