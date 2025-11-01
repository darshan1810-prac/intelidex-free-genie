import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LSTMPrediction } from "./useLSTMPredictions";

export interface LSTMTrade {
  id: string;
  symbol: string;
  trade_type: "BUY" | "SELL";
  amount: number;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  profit_loss: number;
  status: "open" | "closed";
  prediction_data: any;
  executed_at: string;
  closed_at: string | null;
}

export const useLSTMTrades = (userId?: string) => {
  const { toast } = useToast();
  const [trades, setTrades] = useState<LSTMTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lstm_trades")
        .select("*")
        .eq("user_id", uid)
        .order("executed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrades(data as LSTMTrade[]);
    } catch (error: any) {
      console.error("Error fetching LSTM trades:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeTrade = async (
    userId: string,
    symbol: string,
    prediction: LSTMPrediction,
    amount: number,
    currentPrice: number
  ) => {
    try {
      // Check wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (walletError) throw walletError;

      const currentBalance = parseFloat(String(walletData.balance));

      if (amount > currentBalance) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds in your wallet",
          variant: "destructive",
        });
        return false;
      }

      // Calculate quantity based on amount and current price
      const quantity = amount / currentPrice;

      // Deduct from wallet
      const newBalance = currentBalance - amount;
      const { error: updateWalletError } = await supabase
        .from("virtual_wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (updateWalletError) throw updateWalletError;

      // Create LSTM trade
      const { data: tradeData, error: tradeError } = await supabase
        .from("lstm_trades")
        .insert({
          user_id: userId,
          symbol,
          trade_type: prediction.signal,
          amount: amount as any,
          entry_price: currentPrice as any,
          quantity: quantity as any,
          status: "open",
          prediction_data: prediction as any,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        transaction_type: "trade",
        amount: -amount,
        balance_after: newBalance,
        description: `${prediction.signal} ${symbol} - LSTM Trade`,
        related_trade_id: tradeData.id,
      });

      // Update profile investment stats
      const { data: profileData } = await supabase
        .from("profiles")
        .select("lstm_trading_invested")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        const currentInvested = parseFloat(String(profileData.lstm_trading_invested || "0"));
        await supabase
          .from("profiles")
          .update({ lstm_trading_invested: (currentInvested + amount) as any })
          .eq("user_id", userId);
      }

      await fetchTrades(userId);

      toast({
        title: "Trade Executed",
        description: `${prediction.signal} ${quantity.toFixed(8)} ${symbol.replace("USDT", "")} at $${currentPrice.toFixed(2)}`,
      });

      return true;
    } catch (error: any) {
      console.error("Error executing LSTM trade:", error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
      return false;
    }
  };

  const closeTrade = async (userId: string, tradeId: string, exitPrice: number) => {
    try {
      const { data: trade, error: fetchError } = await supabase
        .from("lstm_trades")
        .select("*")
        .eq("id", tradeId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate profit/loss
      const profitLoss =
        trade.trade_type === "BUY"
          ? (exitPrice - trade.entry_price) * trade.quantity
          : (trade.entry_price - exitPrice) * trade.quantity;

      // Update trade
      const { error: updateError } = await supabase
        .from("lstm_trades")
        .update({
          exit_price: exitPrice as any,
          profit_loss: profitLoss as any,
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (updateError) throw updateError;

      // Return funds + profit/loss to wallet
      const { data: walletData, error: walletError } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (walletError) throw walletError;

      const returnAmount = trade.amount + profitLoss;
      const newBalance = parseFloat(String(walletData.balance)) + returnAmount;

      await supabase
        .from("virtual_wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      // Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        transaction_type: profitLoss >= 0 ? "profit" : "loss",
        amount: returnAmount,
        balance_after: newBalance,
        description: `Closed ${trade.trade_type} ${trade.symbol} - ${profitLoss >= 0 ? "Profit" : "Loss"}: $${Math.abs(profitLoss).toFixed(2)}`,
        related_trade_id: tradeId,
      });

      // Update profile stats
      const { data: profileData } = await supabase
        .from("profiles")
        .select("lstm_trading_profit, lstm_trading_invested")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        const currentProfit = parseFloat(String(profileData.lstm_trading_profit || "0"));
        const currentInvested = parseFloat(String(profileData.lstm_trading_invested || "0"));
        await supabase
          .from("profiles")
          .update({
            lstm_trading_profit: (currentProfit + profitLoss) as any,
            lstm_trading_invested: Math.max(0, currentInvested - trade.amount) as any,
          })
          .eq("user_id", userId);
      }

      await fetchTrades(userId);

      toast({
        title: "Trade Closed",
        description: `${profitLoss >= 0 ? "Profit" : "Loss"}: $${Math.abs(profitLoss).toFixed(2)}`,
        variant: profitLoss >= 0 ? "default" : "destructive",
      });

      return true;
    } catch (error: any) {
      console.error("Error closing trade:", error);
      toast({
        title: "Error",
        description: "Failed to close trade",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTrades(userId);
    }
  }, [userId]);

  return {
    trades,
    loading,
    executeTrade,
    closeTrade,
    refetch: userId ? () => fetchTrades(userId) : () => {},
  };
};
