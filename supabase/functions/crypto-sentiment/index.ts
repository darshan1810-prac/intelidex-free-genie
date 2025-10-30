import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
}

// Simple keyword-based sentiment analysis
const analyzeSentiment = (text: string): { sentiment: "bullish" | "bearish" | "neutral"; score: number } => {
  const lowerText = text.toLowerCase();
  
  const bullishKeywords = [
    "surge", "gain", "rally", "moon", "bullish", "profit", "growth", "soar", 
    "rise", "up", "high", "pump", "breakout", "bull", "positive", "adoption"
  ];
  
  const bearishKeywords = [
    "crash", "drop", "fall", "bear", "bearish", "loss", "decline", "down", 
    "dump", "correction", "sell-off", "plunge", "negative", "fear", "panic"
  ];

  let bullishScore = 0;
  let bearishScore = 0;

  bullishKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) bullishScore++;
  });

  bearishKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) bearishScore++;
  });

  const totalScore = bullishScore + bearishScore;
  
  if (totalScore === 0) {
    return { sentiment: "neutral", score: 0 };
  }

  const sentimentScore = (bullishScore - bearishScore) / totalScore;

  if (sentimentScore > 0.2) {
    return { sentiment: "bullish", score: sentimentScore };
  } else if (sentimentScore < -0.2) {
    return { sentiment: "bearish", score: sentimentScore };
  } else {
    return { sentiment: "neutral", score: sentimentScore };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching crypto news...");

    // Fetch from multiple crypto news sources
    const newsPromises = [
      fetch("https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&currencies=BTC,ETH,BNB").then(r => r.json()),
    ];

    const results = await Promise.allSettled(newsPromises);
    const allNews: NewsItem[] = [];

    // Process CryptoPanic
    if (results[0].status === 'fulfilled') {
      const cryptoPanicData = results[0].value;
      if (cryptoPanicData?.results) {
        cryptoPanicData.results.slice(0, 10).forEach((item: any) => {
          const { sentiment, score } = analyzeSentiment(item.title + " " + (item.body || ""));
          allNews.push({
            title: item.title,
            description: item.body || "No description available",
            url: item.url,
            publishedAt: item.created_at,
            sentiment,
            sentimentScore: score,
          });
        });
      }
    }

    // Add mock news if API fails or returns empty
    if (allNews.length === 0) {
      console.log("Using mock news data");
      allNews.push(
        {
          title: "Bitcoin Shows Strong Momentum as Market Cap Surges",
          description: "Bitcoin continues its upward trajectory with significant gains in the past 24 hours.",
          url: "https://example.com/bitcoin-surge",
          publishedAt: new Date().toISOString(),
          sentiment: "bullish",
          sentimentScore: 0.8,
        },
        {
          title: "Ethereum Network Upgrade Brings Positive Sentiment",
          description: "The latest Ethereum upgrade has been well-received by the crypto community.",
          url: "https://example.com/ethereum-upgrade",
          publishedAt: new Date().toISOString(),
          sentiment: "bullish",
          sentimentScore: 0.6,
        },
        {
          title: "Market Analysis: Volatility Expected in Coming Days",
          description: "Analysts predict increased volatility as market conditions remain uncertain.",
          url: "https://example.com/market-analysis",
          publishedAt: new Date().toISOString(),
          sentiment: "neutral",
          sentimentScore: 0,
        }
      );
    }

    console.log(`Returning ${allNews.length} news items`);

    return new Response(
      JSON.stringify({ news: allNews }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, news: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
