import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BinanceKline } from "@/hooks/useBinanceData";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OHLCVTableProps {
  data: BinanceKline[];
  symbol: string;
}

export const OHLCVTable = ({ data, symbol }: OHLCVTableProps) => {
  const exportToCSV = () => {
    const headers = ["Timestamp", "Open", "High", "Low", "Close", "Volume"];
    const rows = data.map((candle) => [
      format(new Date(candle.openTime), "yyyy-MM-dd HH:mm:ss"),
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${symbol}_ohlcv_data.csv`;
    a.click();
  };

  const displayData = data.slice(-20);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>OHLCV Data - {symbol}</CardTitle>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">High</TableHead>
                <TableHead className="text-right">Low</TableHead>
                <TableHead className="text-right">Close</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Change %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((candle, idx) => {
                const changePercent =
                  ((parseFloat(candle.close) - parseFloat(candle.open)) /
                    parseFloat(candle.open)) *
                  100;
                const isPositive = changePercent >= 0;

                return (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(candle.openTime), "MM/dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(candle.open).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-500">
                      {parseFloat(candle.high).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-500">
                      {parseFloat(candle.low).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {parseFloat(candle.close).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {parseFloat(candle.volume).toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        isPositive ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {changePercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Showing last 20 candles of {data.length} total
        </p>
      </CardContent>
    </Card>
  );
};
