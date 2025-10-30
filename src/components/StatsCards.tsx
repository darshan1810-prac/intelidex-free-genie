import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import type { CryptoAsset } from "@/types/crypto";

interface StatsCardsProps {
  data: CryptoAsset[];
}

export const StatsCards = ({ data }: StatsCardsProps) => {
  const totalMarketCap = data.reduce((sum, coin) => sum + coin.market_cap, 0);
  const totalVolume = data.reduce((sum, coin) => sum + coin.total_volume, 0);
  const gainers = data.filter((coin) => coin.price_change_percentage_24h > 0).length;
  const losers = data.filter((coin) => coin.price_change_percentage_24h < 0).length;

  const formatValue = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    return `$${(value / 1e6).toFixed(2)}M`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Market Cap</p>
              <p className="text-2xl font-bold text-card-foreground">{formatValue(totalMarketCap)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-2xl font-bold text-card-foreground">{formatValue(totalVolume)}</p>
            </div>
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gainers (24h)</p>
              <p className="text-2xl font-bold text-success">{gainers}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Losers (24h)</p>
              <p className="text-2xl font-bold text-destructive">{losers}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
