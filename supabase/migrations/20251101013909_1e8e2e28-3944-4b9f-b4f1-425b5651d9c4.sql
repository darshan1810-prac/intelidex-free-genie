-- Create lstm_trades table for LSTM trading execution
CREATE TABLE IF NOT EXISTS public.lstm_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  amount NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  profit_loss NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  prediction_data JSONB,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lstm_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lstm_trades
CREATE POLICY "Users can view their own LSTM trades"
  ON public.lstm_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LSTM trades"
  ON public.lstm_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LSTM trades"
  ON public.lstm_trades FOR UPDATE
  USING (auth.uid() = user_id);

-- Add investment tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paper_trading_invested NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS paper_trading_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lstm_trading_invested NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lstm_trading_profit NUMERIC DEFAULT 0;

-- Create wallet_transactions table for transaction history
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'trade', 'profit', 'loss')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  related_trade_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lstm_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;