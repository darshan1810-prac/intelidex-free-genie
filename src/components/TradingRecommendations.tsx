import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TradingSignal } from "@/hooks/useTradingSignals";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface TradingRecommendationsProps {
  signals: TradingSignal[];
}

export const TradingRecommendations = ({ signals }: TradingRecommendationsProps) => {
  if (!signals || signals.length === 0) {
    return null;
  }

  // Analyze signals to generate recommendations
  const buySignals = signals.filter(s => s.signal_type === "BUY" && s.confidence >= 70);
  const sellSignals = signals.filter(s => s.signal_type === "SELL" && s.confidence >= 70);
  const strongBuySignals = buySignals.filter(s => s.confidence >= 85);
  const strongSellSignals = sellSignals.filter(s => s.confidence >= 85);

  // Calculate market sentiment
  const totalBullish = signals.filter(s => s.sentiment_score > 0.3).length;
  const totalBearish = signals.filter(s => s.sentiment_score < -0.3).length;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  const getMarketSentiment = () => {
    if (totalBullish > totalBearish * 1.5) return { label: "Strong Bullish", color: "text-success", icon: TrendingUp };
    if (totalBullish > totalBearish) return { label: "Bullish", color: "text-success", icon: TrendingUp };
    if (totalBearish > totalBullish * 1.5) return { label: "Strong Bearish", color: "text-destructive", icon: TrendingDown };
    if (totalBearish > totalBullish) return { label: "Bearish", color: "text-destructive", icon: TrendingDown };
    return { label: "Neutral", color: "text-muted-foreground", icon: AlertTriangle };
  };

  const sentiment = getMarketSentiment();
  const SentimentIcon = sentiment.icon;

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          AI Trading Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Overview */}
        <Alert>
          <SentimentIcon className="h-4 w-4" />
          <AlertTitle>Market Sentiment: {sentiment.label}</AlertTitle>
          <AlertDescription>
            Based on analysis of {signals.length} trading signals with an average confidence of {avgConfidence.toFixed(0)}%
          </AlertDescription>
        </Alert>

        {/* Strong Buy Signals */}
        {strongBuySignals.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-success flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Strong Buy Opportunities ({strongBuySignals.length})
            </h3>
            <div className="space-y-2">
              {strongBuySignals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{signal.symbol}</span>
                    <Badge variant="default" className="bg-success">
                      {signal.confidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{signal.reasoning}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Target: +{signal.target_price_pct}%</span>
                    <span>Stop Loss: -{signal.stop_loss_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong Sell Signals */}
        {strongSellSignals.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Strong Sell Warnings ({strongSellSignals.length})
            </h3>
            <div className="space-y-2">
              {strongSellSignals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{signal.symbol}</span>
                    <Badge variant="destructive">
                      {signal.confidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{signal.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">Recommended Actions:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {strongBuySignals.length > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Consider taking positions in {strongBuySignals.map(s => s.symbol).slice(0, 3).join(", ")} with proper risk management</span>
              </li>
            )}
            {strongSellSignals.length > 0 && (
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Review and consider reducing exposure to {strongSellSignals.map(s => s.symbol).slice(0, 3).join(", ")}</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Always use stop-loss orders and never invest more than you can afford to lose</span>
            </li>
            {avgConfidence < 60 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <span>Market confidence is moderate. Consider waiting for clearer signals before making major moves</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
