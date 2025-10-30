import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCryptoData, useCryptoChart } from "@/hooks/useCryptoData";
import { useSettings } from "@/hooks/useSettings";
import { CryptoTable } from "@/components/CryptoTable";
import { PriceChart } from "@/components/PriceChart";
import { CorrelationMatrix } from "@/components/CorrelationMatrix";
import { NewsFeed } from "@/components/NewsFeed";
import { StatsCards } from "@/components/StatsCards";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});

  const { data: cryptoData, isLoading, refetch } = useCryptoData(settings.refreshInterval);
  const { data: chartData } = useCryptoChart(selectedCoin, 7);

  // Build price history for correlation
  useEffect(() => {
    if (cryptoData) {
      const history: Record<string, number[]> = {};
      cryptoData.forEach((coin) => {
        if (!history[coin.id]) {
          history[coin.id] = [];
        }
        history[coin.id].push(coin.current_price);
        // Keep only last 30 data points
        if (history[coin.id].length > 30) {
          history[coin.id].shift();
        }
      });
      setPriceHistory((prev) => ({ ...prev, ...history }));
    }
  }, [cryptoData]);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Data refreshed");
  };

  const selectedCoinData = cryptoData?.find((coin) => coin.id === selectedCoin);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Intellidex</h1>
              <p className="text-sm text-muted-foreground">Free Edition - Crypto Analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading market data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            {cryptoData && <StatsCards data={cryptoData} />}

            {/* Crypto Table */}
            {cryptoData && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Live Market</h2>
                <CryptoTable data={cryptoData} onCoinSelect={setSelectedCoin} />
              </div>
            )}

            {/* Chart Section */}
            {chartData && selectedCoinData && (
              <PriceChart
                data={chartData.prices}
                volumes={chartData.volumes}
                coinName={selectedCoinData.name}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Correlation Matrix */}
              {cryptoData && Object.keys(priceHistory).length > 0 && (
                <CorrelationMatrix coins={cryptoData} priceHistory={priceHistory} />
              )}

              {/* News Feed */}
              <NewsFeed />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
