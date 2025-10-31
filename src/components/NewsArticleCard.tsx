import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { NewsArticle } from "@/hooks/useNewsArticles";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NewsArticleCardProps {
  article: NewsArticle;
}

export const NewsArticleCard = ({ article }: NewsArticleCardProps) => {
  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSentimentBadge = () => {
    if (!article.sentiment) return null;

    const variants = {
      bullish: "default",
      bearish: "destructive",
      neutral: "secondary",
    } as const;

    return (
      <Badge variant={variants[article.sentiment]} className="text-xs">
        {article.sentiment.toUpperCase()}
      </Badge>
    );
  };

  const getSentimentScore = () => {
    if (article.sentiment_score === null) return null;
    
    const score = article.sentiment_score;
    const percentage = Math.abs(score * 100).toFixed(0);
    const color = score > 0 ? "text-success" : score < 0 ? "text-destructive" : "text-muted-foreground";
    
    return (
      <span className={cn("text-sm font-mono font-semibold", color)}>
        {score > 0 ? "+" : ""}{percentage}%
      </span>
    );
  };

  return (
    <Card className="border-border bg-card hover:bg-accent/5 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {article.is_analyzed && getSentimentIcon()}
              {getSentimentBadge()}
              {getSentimentScore()}
            </div>
            <h3 className="font-semibold text-card-foreground leading-tight">
              {article.title}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {article.symbols.map((symbol) => (
            <Badge key={symbol} variant="outline" className="text-xs">
              {symbol}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{article.source}</span>
            <span>•</span>
            <span>{format(new Date(article.published_at), "MMM dd, HH:mm")}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Read <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
