import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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

export const financialNewsTool = createTool({
  id: 'get-financial-news',
  description: 'Fetches recent financial news and sentiment for a company ticker symbol',
  inputSchema: z.object({
    ticker: z.string().describe('Stock ticker symbol e.g. AAPL, MSFT, TSLA'),
  }),
  outputSchema: z.object({
    ticker: z.string(),
    articles: z.array(
      z.object({
        title: z.string(),
        summary: z.string(),
        sentiment: z.string(),
        sentimentScore: z.number(),
        publishedAt: z.string(),
        url: z.string(),
      })
    ),
    overallSentiment: z.string(),
    avgSentimentScore: z.number(),
  }),
  execute: async ({ ticker }: { ticker: string }) => {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=5&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as AlphaVantageNewsResponse;

    if (!data.feed || data.feed.length === 0) {
      throw new Error(`No news found for ticker ${ticker}`);
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

    const overallSentiment =
      avgSentimentScore >= 0.35
        ? 'Bullish'
        : avgSentimentScore <= -0.35
          ? 'Bearish'
          : 'Neutral';

    return {
      ticker,
      articles,
      overallSentiment,
      avgSentimentScore,
    };
  },
});