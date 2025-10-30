import type { BinanceKline } from "@/hooks/useBinanceData";

export const exportToCSV = (data: BinanceKline[], symbol: string, startDate?: string, endDate?: string) => {
  const headers = ["Date/Time", "Open", "High", "Low", "Close", "Volume"];
  
  // Filter data by date range if provided
  let filteredData = data;
  if (startDate || endDate) {
    filteredData = data.filter((kline) => {
      const klineDate = new Date(kline.openTime);
      if (startDate && klineDate < new Date(startDate)) return false;
      if (endDate && klineDate > new Date(endDate)) return false;
      return true;
    });
  }
  
  const rows = filteredData.map((kline) => [
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
  
  const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
  link.setAttribute("href", url);
  link.setAttribute("download", `${symbol}${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
