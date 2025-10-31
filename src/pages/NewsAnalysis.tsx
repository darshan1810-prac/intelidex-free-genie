import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Newspaper, TrendingUp, Activity } from "lucide-react";
import { useNewsArticles, useTriggerNewsFetch } from "@/hooks/useNewsArticles";
import { useTradingSignals } from "@/hooks/useTradingSignals";
import { NewsArticleCard } from "@/components/NewsArticleCard";
import { TradingSignalCard } from "@/components/TradingSignalCard";
import { toast } from "sonner";

const CRYPTO_SYMBOLS = [
  "ALL", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "MATIC", "DOT", "AVAX"
];

const NewsAnalysis = () => {
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [isFetching, setIsFetching] = useState(false);

  const symbolFilter = selectedSymbol === "ALL" ? undefined : selectedSymbol;
  
  const { data: articles, isLoading: articlesLoading, refetch: refetchArticles } = useNewsArticles(50, symbolFilter);
  const { data: signals, isLoading: signalsLoading, refetch: refetchSignals } = useTradingSignals(true, symbolFilter ? `${symbolFilter}USDT` : undefined);
  const { trigger: triggerFetch } = useTriggerNewsFetch();

  const handleFetchNews = async () => {
    setIsFetching(true);
    try {
      await triggerFetch();
      toast.success("News fetched successfully! Analysis in progress...");
      
      // Refetch data after a delay to allow analysis to complete
      setTimeout(() => {
        refetchArticles();
        refetchSignals();
      }, 3000);
    } catch (error: any) {
      toast.error("Failed to fetch news: " + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Calculate statistics
  const activeSignals = signals?.filter(s => s.is_active) || [];
  const buySignals = activeSignals.filter(s => s.signal_type === "BUY");
  const sellSignals = activeSignals.filter(s => s.signal_type === "SELL");
  const avgConfidence = activeSignals.length > 0
    ? (activeSignals.reduce((sum, s) => sum + s.confidence, 0) / activeSignals.length).toFixed(0)
    : "0";

  const bullishArticles = articles?.filter(a => a.sentiment === "bullish") || [];
  const bearishArticles = articles?.filter(a => a.sentiment === "bearish") || [];
  const analyzedArticles = articles?.filter(a => a.is_analyzed) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex gap-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleFetchNews}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              Fetch News
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Newspaper className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">News Analysis Dashboard</h1>
            <p className="text-muted-foreground">AI-powered crypto news sentiment and trading signals</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeSignals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {buySignals.length} BUY • {sellSignals.length} SELL
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{avgConfidence}%</div>
              <p className="text-xs text-muted-foreground mt-1">Signal strength</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">News Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{articles?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyzedArticles.length} analyzed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                <div className="text-2xl font-bold text-foreground">
                  {bullishArticles.length > bearishArticles.length ? (
                    <span className="text-success">Bullish</span>
                  ) : bearishArticles.length > bullishArticles.length ? (
                    <span className="text-destructive">Bearish</span>
                  ) : (
                    <span className="text-muted-foreground">Neutral</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bullishArticles.length} bullish • {bearishArticles.length} bearish
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="signals" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trading Signals
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" />
              News Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="space-y-4">
            {signalsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading signals...
              </div>
            ) : activeSignals.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active trading signals</p>
                  <p className="text-sm mt-2">Click "Fetch News" to analyze latest market news</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSignals.map((signal) => (
                  <TradingSignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            {articlesLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading news articles...
              </div>
            ) : !articles || articles.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No news articles available</p>
                  <p className="text-sm mt-2">Click "Fetch News" to load latest crypto news</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article) => (
                  <NewsArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NewsAnalysis;
