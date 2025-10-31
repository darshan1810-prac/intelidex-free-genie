import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Clock, Target, Shield } from "lucide-react";
import { TradingSignal } from "@/hooks/useTradingSignals";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TradingSignalCardProps {
  signal: TradingSignal;
}

export const TradingSignalCard = ({ signal }: TradingSignalCardProps) => {
  const getSignalIcon = () => {
    switch (signal.signal_type) {
      case "BUY":
        return <TrendingUp className="w-5 h-5 text-success" />;
      case "SELL":
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSignalBadge = () => {
    const variants = {
      BUY: "default",
      SELL: "destructive",
      HOLD: "secondary",
    } as const;

    return (
      <Badge variant={variants[signal.signal_type]} className="text-sm font-bold">
        {signal.signal_type}
      </Badge>
    );
  };

  const getConfidenceColor = () => {
    if (signal.confidence >= 80) return "text-success";
    if (signal.confidence >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(signal.expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    return formatDistanceToNow(expires, { addSuffix: true });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getSignalIcon()}
            <div>
              <CardTitle className="text-xl font-bold">{signal.symbol}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getSignalBadge()}
                <span className={cn("text-sm font-mono font-semibold", getConfidenceColor())}>
                  {signal.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Confidence Level</span>
            <span>{signal.confidence}%</span>
          </div>
          <Progress value={signal.confidence} className="h-2" />
        </div>

        {/* Price Targets */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>Target</span>
            </div>
            <div className="text-lg font-bold text-success">
              {signal.target_price_pct > 0 ? "+" : ""}
              {signal.target_price_pct.toFixed(2)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Stop Loss</span>
            </div>
            <div className="text-lg font-bold text-destructive">
              {signal.stop_loss_pct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{getTimeRemaining()}</span>
          </div>
          <span>{signal.article_count} articles analyzed</span>
        </div>

        {/* Reasoning Accordion */}
        <Accordion type="single" collapsible className="border-t pt-2">
          <AccordionItem value="reasoning" className="border-none">
            <AccordionTrigger className="text-xs font-semibold py-2">
              View AI Analysis
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
              {signal.reasoning}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Sentiment Score */}
        <div className="text-xs text-muted-foreground">
          Sentiment Score: 
          <span className={cn(
            "ml-2 font-mono font-semibold",
            signal.sentiment_score > 0 ? "text-success" : "text-destructive"
          )}>
            {signal.sentiment_score > 0 ? "+" : ""}
            {(signal.sentiment_score * 100).toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
