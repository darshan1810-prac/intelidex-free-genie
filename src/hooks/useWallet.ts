import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WalletData {
  balance: number;
  paperTradingInvested: number;
  paperTradingProfit: number;
  lstmTradingInvested: number;
  lstmTradingProfit: number;
}

export const useWallet = (userId?: string) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async (uid: string) => {
    setLoading(true);
    try {
      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", uid)
        .maybeSingle();

      if (walletError) throw walletError;

      // Fetch profile stats
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "paper_trading_invested, paper_trading_profit, lstm_trading_invested, lstm_trading_profit"
        )
        .eq("user_id", uid)
        .maybeSingle();

      if (profileError) throw profileError;

      setWallet({
        balance: parseFloat(String(walletData?.balance || "0")),
        paperTradingInvested: parseFloat(String(profileData?.paper_trading_invested || "0")),
        paperTradingProfit: parseFloat(String(profileData?.paper_trading_profit || "0")),
        lstmTradingInvested: parseFloat(String(profileData?.lstm_trading_invested || "0")),
        lstmTradingProfit: parseFloat(String(profileData?.lstm_trading_profit || "0")),
      });
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async (userId: string, amount: number) => {
    try {
      const { data: currentWallet, error: fetchError } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = parseFloat(String(currentWallet.balance)) + amount;

      const { error: updateError } = await supabase
        .from("virtual_wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        transaction_type: "deposit",
        amount,
        balance_after: newBalance,
        description: "Manual deposit",
      });

      await fetchWallet(userId);
      
      toast({
        title: "Funds Added",
        description: `$${amount.toFixed(2)} added to your wallet`,
      });

      return true;
    } catch (error: any) {
      console.error("Error adding funds:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add funds",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWallet(userId);
    }
  }, [userId]);

  return {
    wallet,
    loading,
    refetch: userId ? () => fetchWallet(userId) : () => {},
    addFunds,
  };
};
