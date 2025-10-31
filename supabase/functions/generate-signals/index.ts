import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating trading signals from analyzed news...');

    // Fetch analyzed articles from the last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: articles, error: fetchError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('is_analyzed', true)
      .gte('published_at', fourHoursAgo)
      .order('published_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No articles to process for signals' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${articles.length} articles for signal generation`);

    // Group articles by symbol
    const symbolMap = new Map<string, any[]>();
    
    for (const article of articles) {
      for (const symbol of article.symbols) {
        if (!symbolMap.has(symbol)) {
          symbolMap.set(symbol, []);
        }
        symbolMap.get(symbol)!.push(article);
      }
    }

    const generatedSignals = [];

    // Generate signals for each symbol
    for (const [symbol, symbolArticles] of symbolMap.entries()) {
      console.log(`Analyzing ${symbolArticles.length} articles for ${symbol}`);

      // Calculate aggregate sentiment
      const sentimentScores = symbolArticles
        .filter(a => a.sentiment_score !== null)
        .map(a => a.sentiment_score);

      if (sentimentScores.length === 0) continue;

      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      const bullishCount = symbolArticles.filter(a => a.sentiment === 'bullish').length;
      const bearishCount = symbolArticles.filter(a => a.sentiment === 'bearish').length;
      const neutralCount = symbolArticles.filter(a => a.sentiment === 'neutral').length;

      // Determine signal type based on sentiment strength
      let signalType: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;

      if (avgSentiment > 0.3 && bullishCount > bearishCount) {
        signalType = 'BUY';
        confidence = Math.min(95, 50 + (avgSentiment * 50) + (bullishCount * 5));
      } else if (avgSentiment < -0.3 && bearishCount > bullishCount) {
        signalType = 'SELL';
        confidence = Math.min(95, 50 + (Math.abs(avgSentiment) * 50) + (bearishCount * 5));
      } else {
        signalType = 'HOLD';
        confidence = Math.max(30, 50 - Math.abs(avgSentiment) * 20);
      }

      // Get AI analysis for detailed reasoning
      const articleSummary = symbolArticles
        .slice(0, 5)
        .map(a => `- ${a.title} (Sentiment: ${a.sentiment}, Score: ${a.sentiment_score})`)
        .join('\n');

      const prompt = `As a cryptocurrency trading analyst, generate a detailed trading signal analysis for ${symbol} based on recent news sentiment.

Recent News Analysis:
${articleSummary}

Aggregate Metrics:
- Average Sentiment Score: ${avgSentiment.toFixed(2)}
- Bullish Articles: ${bullishCount}
- Bearish Articles: ${bearishCount}
- Neutral Articles: ${neutralCount}

Current Signal: ${signalType} with ${confidence.toFixed(0)}% confidence

Provide:
1. Detailed reasoning for this signal
2. Target price suggestion (percentage move)
3. Stop loss recommendation (percentage)
4. Risk assessment
5. Key catalysts from the news

Respond in JSON format:
{
  "reasoning": "<detailed multi-line reasoning>",
  "target_price_pct": <number>,
  "stop_loss_pct": <number>,
  "risk_level": "low|medium|high",
  "key_catalysts": ["catalyst1", "catalyst2", "catalyst3"],
  "time_horizon": "short|medium|long"
}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a professional cryptocurrency trading analyst. Always respond with valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.4,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error for ${symbol}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error(`No content in AI response for ${symbol}`);
          continue;
        }

        const analysis = JSON.parse(content);

        // Create signal
        const signal = {
          symbol: `${symbol}USDT`,
          signal_type: signalType,
          confidence: Math.round(confidence),
          reasoning: analysis.reasoning,
          target_price_pct: analysis.target_price_pct,
          stop_loss_pct: analysis.stop_loss_pct,
          source: 'news_sentiment',
          article_count: symbolArticles.length,
          sentiment_score: avgSentiment,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          is_active: true,
        };

        // Insert signal
        const { data: insertedSignal, error: insertError } = await supabase
          .from('trading_signals')
          .insert(signal)
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting signal for ${symbol}:`, insertError);
          continue;
        }

        generatedSignals.push(insertedSignal);
        console.log(`Generated ${signalType} signal for ${symbol} with ${confidence.toFixed(0)}% confidence`);

      } catch (error: any) {
        console.error(`Error generating signal for ${symbol}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signalsGenerated: generatedSignals.length,
        signals: generatedSignals,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-signals function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
