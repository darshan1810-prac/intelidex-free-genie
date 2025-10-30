import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { calculateCorrelation } from "@/utils/technicalIndicators";
import type { CryptoAsset } from "@/types/crypto";

interface CorrelationMatrixProps {
  coins: CryptoAsset[];
  priceHistory: Record<string, number[]>;
}

export const CorrelationMatrix = ({ coins, priceHistory }: CorrelationMatrixProps) => {
  const topCoins = coins.slice(0, 5);

  const getCorrelation = (coin1: string, coin2: string) => {
    if (!priceHistory[coin1] || !priceHistory[coin2]) return 0;
    return calculateCorrelation(priceHistory[coin1], priceHistory[coin2]);
  };

  const getCorrelationColor = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0.7) return "bg-success/80";
    if (value > 0.4) return "bg-success/50";
    if (value > 0) return "bg-success/20";
    if (value > -0.4) return "bg-destructive/20";
    if (value > -0.7) return "bg-destructive/50";
    return "bg-destructive/80";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          ClusterDex - Correlation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground text-sm font-semibold"></th>
                {topCoins.map((coin) => (
                  <th key={coin.id} className="p-2 text-center text-muted-foreground text-sm font-semibold">
                    {coin.symbol.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCoins.map((coin1) => (
                <tr key={coin1.id}>
                  <td className="p-2 text-muted-foreground text-sm font-semibold">
                    {coin1.symbol.toUpperCase()}
                  </td>
                  {topCoins.map((coin2) => {
                    const correlation = getCorrelation(coin1.id, coin2.id);
                    return (
                      <td key={coin2.id} className="p-2">
                        <div
                          className={`${getCorrelationColor(
                            correlation
                          )} rounded p-2 text-center font-mono text-sm text-card-foreground`}
                        >
                          {coin1.id === coin2.id ? "1.00" : correlation.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Values closer to 1.0 indicate strong positive correlation (coins move together)</p>
          <p>Values closer to -1.0 indicate strong negative correlation (coins move opposite)</p>
        </div>
      </CardContent>
    </Card>
  );
};
