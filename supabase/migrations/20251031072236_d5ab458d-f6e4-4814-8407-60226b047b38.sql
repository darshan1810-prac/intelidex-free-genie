-- Create news_articles table
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  sentiment_score NUMERIC,
  is_analyzed BOOLEAN NOT NULL DEFAULT false,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on url for faster lookups and upsert operations
CREATE INDEX IF NOT EXISTS idx_news_articles_url ON public.news_articles(url);

-- Create index on published_at for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at DESC);

-- Create index on symbols for faster filtering
CREATE INDEX IF NOT EXISTS idx_news_articles_symbols ON public.news_articles USING GIN(symbols);

-- Create index on is_analyzed for faster filtering
CREATE INDEX IF NOT EXISTS idx_news_articles_is_analyzed ON public.news_articles(is_analyzed);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read news articles (public data)
CREATE POLICY "News articles are viewable by everyone"
  ON public.news_articles
  FOR SELECT
  USING (true);

-- Create trading_signals table
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT NOT NULL,
  target_price_pct NUMERIC NOT NULL,
  stop_loss_pct NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'news_sentiment',
  article_count INTEGER NOT NULL DEFAULT 0,
  sentiment_score NUMERIC NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON public.trading_signals(symbol);

-- Create index on is_active and expires_at for faster active signal queries
CREATE INDEX IF NOT EXISTS idx_trading_signals_active ON public.trading_signals(is_active, expires_at DESC);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON public.trading_signals(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read trading signals (public data)
CREATE POLICY "Trading signals are viewable by everyone"
  ON public.trading_signals
  FOR SELECT
  USING (true);

-- Create function to automatically deactivate expired signals
CREATE OR REPLACE FUNCTION public.deactivate_expired_signals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.trading_signals
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run deactivation check on insert/update
CREATE TRIGGER trigger_deactivate_expired_signals
  AFTER INSERT OR UPDATE ON public.trading_signals
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.deactivate_expired_signals();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;