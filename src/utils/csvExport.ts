import type { BinanceKline } from "@/hooks/useBinanceData";

export const exportToCSV = (data: BinanceKline[], symbol: string) => {
  const headers = ["Date/Time", "Open", "High", "Low", "Close", "Volume"];
  
  const rows = data.map((kline) => [
    new Date(kline.openTime).toISOString(),
    kline.open,
    kline.high,
    kline.low,
    kline.close,
    kline.volume,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${symbol}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
