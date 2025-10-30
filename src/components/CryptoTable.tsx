import { ArrowUpIcon, ArrowDownIcon, TrendingUp } from "lucide-react";
import type { CryptoAsset } from "@/types/crypto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CryptoTableProps {
  data: CryptoAsset[];
  onCoinSelect?: (coinId: string) => void;
}

export const CryptoTable = ({ data, onCoinSelect }: CryptoTableProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-secondary/50">
            <TableHead className="text-muted-foreground font-semibold">Coin</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Price</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">24h Change</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Market Cap</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Volume (24h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((crypto) => (
            <TableRow
              key={crypto.id}
              className="border-border hover:bg-secondary/30 cursor-pointer transition-colors"
              onClick={() => onCoinSelect?.(crypto.id)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <img src={crypto.image} alt={crypto.name} className="w-8 h-8" />
                  <div>
                    <div className="text-card-foreground font-semibold">{crypto.name}</div>
                    <div className="text-muted-foreground text-sm uppercase">{crypto.symbol}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-card-foreground">
                {formatPrice(crypto.current_price)}
              </TableCell>
              <TableCell className="text-right">
                <div
                  className={`flex items-center justify-end gap-1 font-semibold ${
                    crypto.price_change_percentage_24h > 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {crypto.price_change_percentage_24h > 0 ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-card-foreground">
                {formatMarketCap(crypto.market_cap)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatMarketCap(crypto.total_volume)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
