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

    const { articleIds } = await req.json();

    if (!articleIds || articleIds.length === 0) {
      throw new Error('No article IDs provided');
    }

    console.log(`Analyzing sentiment for ${articleIds.length} articles...`);

    // Fetch articles
    const { data: articles, error: fetchError } = await supabase
      .from('news_articles')
      .select('*')
      .in('id', articleIds)
      .is('is_analyzed', false);

    if (fetchError) throw fetchError;

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No articles to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyzedArticles = [];

    for (const article of articles) {
      console.log(`Analyzing article: ${article.title}`);

      const prompt = `You are an expert financial analyst specializing in cryptocurrency markets. Analyze the following news article and provide:

1. Sentiment classification (bullish, bearish, or neutral)
2. Sentiment score (a number from -1.0 to 1.0, where -1.0 is extremely bearish, 0 is neutral, and 1.0 is extremely bullish)
3. Brief reasoning for your analysis
4. Impact assessment (low, medium, high)

Article Title: ${article.title}
Article Content: ${article.content}
Mentioned Symbols: ${article.symbols.join(', ')}

Consider:
- Price impact potential
- Market sentiment indicators
- Regulatory implications
- Technology developments
- Adoption news
- Security concerns
- Trading volume implications

Respond in JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "sentiment_score": <number between -1 and 1>,
  "reasoning": "<brief explanation>",
  "impact": "low|medium|high",
  "key_points": ["point1", "point2", "point3"]
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
              { role: 'system', content: 'You are a cryptocurrency market analyst. Always respond with valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error('No content in AI response');
          continue;
        }

        // Parse JSON response
        const analysis = JSON.parse(content);

        // Update article with sentiment
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({
            sentiment: analysis.sentiment,
            sentiment_score: analysis.sentiment_score,
            is_analyzed: true,
            analyzed_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
          continue;
        }

        analyzedArticles.push({
          articleId: article.id,
          sentiment: analysis.sentiment,
          score: analysis.sentiment_score,
          reasoning: analysis.reasoning,
          impact: analysis.impact,
        });

        console.log(`Article ${article.id} analyzed: ${analysis.sentiment} (${analysis.sentiment_score})`);

      } catch (error: any) {
        console.error(`Error analyzing article ${article.id}:`, error);
        continue;
      }
    }

    // Trigger signal generation if we analyzed articles
    if (analyzedArticles.length > 0) {
      console.log('Triggering signal generation...');
      const { error: signalError } = await supabase.functions.invoke('generate-signals');
      
      if (signalError) {
        console.error('Error triggering signal generation:', signalError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articlesAnalyzed: analyzedArticles.length,
        results: analyzedArticles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
