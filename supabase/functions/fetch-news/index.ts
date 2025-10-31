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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching crypto news from CryptoPanic API...');

    // Fetch from CryptoPanic (free tier)
    const cryptoPanicResponse = await fetch(
      'https://cryptopanic.com/api/v1/posts/?auth_token=free&filter=rising&public=true',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!cryptoPanicResponse.ok) {
      throw new Error(`CryptoPanic API error: ${cryptoPanicResponse.status}`);
    }

    const cryptoPanicData = await cryptoPanicResponse.json();
    console.log(`Fetched ${cryptoPanicData.results?.length || 0} articles from CryptoPanic`);

    // Process articles
    const articles = [];
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX'];

    for (const item of cryptoPanicData.results || []) {
      // Extract symbols from currencies
      const mentionedSymbols = (item.currencies || [])
        .map((c: any) => c.code)
        .filter((code: string) => symbols.includes(code));

      if (mentionedSymbols.length === 0) continue;

      const article = {
        title: item.title || 'Untitled',
        content: item.title || '',
        source: item.domain || 'cryptopanic.com',
        url: item.url || '',
        published_at: new Date(item.created_at || Date.now()).toISOString(),
        symbols: mentionedSymbols,
        sentiment: null,
        sentiment_score: null,
        is_analyzed: false,
      };

      articles.push(article);
    }

    console.log(`Processed ${articles.length} articles with crypto symbols`);

    // Insert articles into database (avoiding duplicates)
    if (articles.length > 0) {
      const { data: insertedArticles, error: insertError } = await supabase
        .from('news_articles')
        .upsert(articles, { 
          onConflict: 'url',
          ignoreDuplicates: true 
        })
        .select();

      if (insertError) {
        console.error('Error inserting articles:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${insertedArticles?.length || 0} new articles`);

      // Trigger sentiment analysis for new articles
      if (insertedArticles && insertedArticles.length > 0) {
        console.log('Triggering sentiment analysis...');
        const { error: analysisError } = await supabase.functions.invoke('analyze-sentiment', {
          body: { articleIds: insertedArticles.map((a: any) => a.id) },
        });

        if (analysisError) {
          console.error('Error triggering sentiment analysis:', analysisError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          articlesProcessed: articles.length,
          articlesInserted: insertedArticles?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        articlesProcessed: 0,
        articlesInserted: 0,
        message: 'No new articles to process',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
