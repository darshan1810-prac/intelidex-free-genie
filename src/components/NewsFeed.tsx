import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsItem } from "@/types/crypto";
import { supabase } from "@/integrations/supabase/client";

export const NewsFeed = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ["crypto-news"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ news: NewsItem[] }>(
        "crypto-sentiment"
      );
      
      if (error) throw error;
      return data?.news || [];
    },
    refetchInterval: 300000, // 5 minutes
  });

  const getSentimentIcon = (sentiment: NewsItem["sentiment"]) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSentimentBadge = (sentiment: NewsItem["sentiment"]) => {
    const variants = {
      bullish: "default",
      bearish: "destructive",
      neutral: "secondary",
    } as const;

    return (
      <Badge variant={variants[sentiment]} className="text-xs">
        {sentiment.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          Crypto News & Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground text-center py-8">Loading news...</div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {news?.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSentimentIcon(item.sentiment)}
                      {getSentimentBadge(item.sentiment)}
                    </div>
                    <h3 className="font-semibold text-card-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                      >
                        Read More <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
