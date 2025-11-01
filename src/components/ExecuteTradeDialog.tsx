import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type { LSTMPrediction } from "@/hooks/useLSTMPredictions";

interface ExecuteTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: LSTMPrediction | null;
  symbol: string;
  currentPrice: number;
  walletBalance: number;
  onExecute: (amount: number) => Promise<boolean>;
}

export const ExecuteTradeDialog = ({
  open,
  onOpenChange,
  prediction,
  symbol,
  currentPrice,
  walletBalance,
  onExecute,
}: ExecuteTradeDialogProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!prediction) return null;

  const handleExecute = async () => {
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) return;

    setLoading(true);
    const success = await onExecute(tradeAmount);
    setLoading(false);

    if (success) {
      setAmount("");
      onOpenChange(false);
    }
  };

  const quantity = parseFloat(amount || "0") / currentPrice;
  const maxAmount = Math.min(walletBalance, walletBalance * 0.5); // Max 50% of wallet

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Execute Trade
            <Badge variant={prediction.signal === "BUY" ? "default" : "destructive"}>
              {prediction.signal}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Execute a trade based on LSTM prediction for {symbol.replace("USDT", "")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prediction Info */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <div className="flex items-center gap-1 mt-1">
                {prediction.signal === "BUY" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`font-bold ${prediction.signal === "BUY" ? "text-green-500" : "text-red-500"}`}>
                  {prediction.signal}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-lg font-bold mt-1">{(prediction.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="text-lg font-mono mt-1">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Predicted Price</p>
              <p className="text-lg font-mono mt-1">${prediction.close_price.toFixed(2)}</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Wallet Balance</span>
            </div>
            <span className="font-mono font-bold">${walletBalance.toFixed(2)}</span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Trade Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: $10.00</span>
              <span>Max: ${maxAmount.toFixed(2)} (50% of wallet)</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((walletBalance * 0.1).toFixed(2))}
            >
              10%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((walletBalance * 0.25).toFixed(2))}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((walletBalance * 0.5).toFixed(2))}
            >
              50%
            </Button>
          </div>

          {/* Trade Details */}
          {parseFloat(amount || "0") > 0 && (
            <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono font-bold">{quantity.toFixed(8)} {symbol.replace("USDT", "")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry Price</span>
                <span className="font-mono">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected P/L</span>
                <span className={`font-mono font-bold ${prediction.signal === "BUY" ? "text-green-500" : "text-red-500"}`}>
                  {prediction.signal === "BUY"
                    ? `+$${((prediction.close_price - currentPrice) * quantity).toFixed(2)}`
                    : `-$${((currentPrice - prediction.close_price) * quantity).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={loading || parseFloat(amount || "0") <= 0 || parseFloat(amount || "0") > maxAmount}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Execute Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
