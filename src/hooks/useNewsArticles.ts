import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  published_at: string;
  symbols: string[];
  sentiment: "bullish" | "bearish" | "neutral" | null;
  sentiment_score: number | null;
  is_analyzed: boolean;
  analyzed_at: string | null;
  created_at: string;
}

export const useNewsArticles = (limit = 50, symbolFilter?: string) => {
  const query = useQuery({
    queryKey: ["news-articles", limit, symbolFilter],
    queryFn: async () => {
      let query = supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (symbolFilter) {
        query = query.contains("symbols", [symbolFilter]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NewsArticle[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("news-articles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "news_articles",
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return query;
};

export const useTriggerNewsFetch = () => {
  const trigger = async () => {
    const { data, error } = await supabase.functions.invoke("fetch-news");
    
    if (error) throw error;
    return data;
  };

  return { trigger };
};
