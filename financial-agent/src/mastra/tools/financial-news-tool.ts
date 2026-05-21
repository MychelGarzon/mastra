import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ============================================================
// Types
// ============================================================

interface AlphaVantageNewsResponse {
  feed: {
    title: string;
    url: string;
    summary: string;
    overall_sentiment_label: string;
    overall_sentiment_score: number;
    time_published: string;
  }[];
}

// ============================================================
// Schemas
// ============================================================

const articleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sentiment: z.string(),
  sentimentScore: z.number(),
  publishedAt: z.string(),
  url: z.string(),
});

const newsOutputSchema = z.object({
  ticker: z.string(),
  articles: z.array(articleSchema),
  overallSentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
  avgSentimentScore: z.number(),
});

// ============================================================
// Helpers
// ============================================================

const calculateSentiment = (score: number): 'Bullish' | 'Bearish' | 'Neutral' => {
  if (score >= 0.35) return 'Bullish';
  if (score <= -0.35) return 'Bearish';
  return 'Neutral';
};

const fetchNewsFromAPI = async (ticker: string) => {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=5&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;
  const response = await fetch(url);
  return response.json() as Promise<AlphaVantageNewsResponse>;
};

// ============================================================
// Tool
// ============================================================

export const financialNewsTool = createTool({
  id: 'get-financial-news',
  description: 'Fetches recent financial news and sentiment for a company ticker symbol',
  inputSchema: z.object({
    ticker: z.string().describe('Stock ticker symbol e.g. AAPL, MSFT, TSLA'),
  }),
  outputSchema: newsOutputSchema,
  execute: async ({ ticker }: { ticker: string }) => {
    const data = await fetchNewsFromAPI(ticker);

    if (!data.feed || data.feed.length === 0) {
      throw new Error(`No news found for ticker: ${ticker}`);
    }

    const articles = data.feed.slice(0, 5).map((item) => ({
      title: item.title,
      summary: item.summary,
      sentiment: item.overall_sentiment_label,
      sentimentScore: item.overall_sentiment_score,
      publishedAt: item.time_published,
      url: item.url,
    }));

    const avgSentimentScore =
      articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length;

    return {
      ticker,
      articles,
      overallSentiment: calculateSentiment(avgSentimentScore),
      avgSentimentScore,
    };
  },
});