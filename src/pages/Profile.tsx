import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, ArrowLeft, TrendingUp, TrendingDown, Plus, 
  DollarSign, Activity, PieChart, History 
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { wallet, loading, addFunds, refetch } = useWallet(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      const success = await addFunds(user.id, amount);
      if (success) {
        setAddAmount("");
        fetchTransactions(user.id);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const totalInvested = (wallet?.paperTradingInvested || 0) + (wallet?.lstmTradingInvested || 0);
  const totalProfit = (wallet?.paperTradingProfit || 0) + (wallet?.lstmTradingProfit || 0);
  const totalAssets = (wallet?.balance || 0) + totalInvested;

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
                <h1 className="text-2xl font-bold text-primary">Profile Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Wallet Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${loading ? "..." : wallet?.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available funds</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Paper: ${wallet?.paperTradingInvested.toFixed(2)} | LSTM: ${wallet?.lstmTradingInvested.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className={totalProfit >= 0 ? "border-green-500/20" : "border-red-500/20"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paper: ${wallet?.paperTradingProfit.toFixed(2)} | LSTM: ${wallet?.lstmTradingProfit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Funds Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Funds to Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddFunds}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Total Assets</p>
                  <p className="text-2xl font-bold text-primary">${totalAssets.toFixed(2)}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">Paper Trading</p>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <p className="text-lg font-bold">${wallet?.paperTradingInvested.toFixed(2)}</p>
                  <p className={`text-sm ${(wallet?.paperTradingProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    P&L: ${wallet?.paperTradingProfit.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">LSTM Trading</p>
                    <Badge variant="outline">AI-Powered</Badge>
                  </div>
                  <p className="text-lg font-bold">${wallet?.lstmTradingInvested.toFixed(2)}</p>
                  <p className={`text-sm ${(wallet?.lstmTradingProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    P&L: ${wallet?.lstmTradingProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.transaction_type === "deposit" ? "default" :
                          tx.transaction_type === "profit" ? "default" :
                          "secondary"
                        }
                      >
                        {tx.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{tx.description || "-"}</TableCell>
                    <TableCell className={`text-right font-mono ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {tx.amount >= 0 ? "+" : ""}${tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${tx.balance_after.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20" 
            onClick={() => navigate("/paper-trading")}
          >
            <div className="text-center">
              <Activity className="h-5 w-5 mx-auto mb-1" />
              <p className="text-sm font-semibold">Paper Trading</p>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-20" 
            onClick={() => navigate("/trading-bot")}
          >
            <div className="text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1" />
              <p className="text-sm font-semibold">LSTM Bot</p>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-20" 
            onClick={() => navigate("/news-analysis")}
          >
            <div className="text-center">
              <PieChart className="h-5 w-5 mx-auto mb-1" />
              <p className="text-sm font-semibold">News Analysis</p>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
