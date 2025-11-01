import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Wallet, ArrowLeft } from "lucide-react";
import { useBinancePrice, useBinanceTopSymbols } from "@/hooks/useBinanceData";
import type { User } from "@supabase/supabase-js";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
}

const PaperTrading = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [amount, setAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  
  const { data: priceData } = useBinancePrice(selectedSymbol);
  const { data: symbols } = useBinanceTopSymbols();
  const currentPrice = priceData ? parseFloat(priceData.lastPrice) : 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchWallet(session.user.id);
        fetchTrades(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from("virtual_wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      toast.error("Failed to fetch wallet");
    } else if (data) {
      setBalance(parseFloat(data.balance as any));
    }
  };

  const fetchTrades = async (userId: string) => {
    const { data, error } = await supabase
      .from("paper_trades")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Failed to fetch trades");
    } else if (data) {
      setTrades(data);
    }
  };

  const executeTrade = async () => {
    if (!user) return;
    
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const total = tradeAmount * currentPrice;

    if (tradeType === "buy" && total > balance) {
      toast.error("Insufficient balance");
      return;
    }

    const newBalance = tradeType === "buy" ? balance - total : balance + total;

    const { error: tradeError } = await supabase
      .from("paper_trades")
      .insert([{
        user_id: user.id,
        symbol: selectedSymbol,
        trade_type: tradeType,
        amount: tradeAmount as any,
        price: currentPrice as any,
        total: total as any,
      }]);

    if (tradeError) {
      toast.error("Trade failed");
      return;
    }

    const { error: walletError } = await supabase
      .from("virtual_wallets")
      .update({ balance: newBalance as any })
      .eq("user_id", user.id);

    if (walletError) {
      toast.error("Failed to update balance");
      return;
    }

    setBalance(newBalance);
    setAmount("");
    toast.success(`${tradeType === "buy" ? "Bought" : "Sold"} ${tradeAmount} ${selectedSymbol.replace("USDT", "")}`);
    fetchTrades(user.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">Paper Trading</h1>
                <p className="text-sm text-muted-foreground">Test your strategies risk-free</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="font-mono text-lg text-foreground">${balance.toFixed(2)}</span>
              </div>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>Profile</Button>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Execute Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {symbols?.slice(0, 20).map((symbol: string) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol.replace("USDT", "/USDT")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Price</Label>
                <div className="text-2xl font-mono text-primary">
                  ${currentPrice.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <div className="text-xl font-mono text-foreground">
                  ${(parseFloat(amount || "0") * currentPrice).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => { setTradeType("buy"); executeTrade(); }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => { setTradeType("sell"); executeTrade(); }}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {trade.symbol.replace("USDT", "")}
                      </TableCell>
                      <TableCell>
                        <span className={trade.trade_type === "buy" ? "text-green-500" : "text-red-500"}>
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {trade.amount.toFixed(8)}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        ${trade.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        ${trade.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaperTrading;
