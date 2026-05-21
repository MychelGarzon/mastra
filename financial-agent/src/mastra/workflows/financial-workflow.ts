import { createStep, createWorkflow } from '@mastra/core/workflows';
import { Resend } from 'resend';
import { z } from 'zod';

// ============================================================
// Config
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = 'mychel.garzon@gmail.com';

// ============================================================
// Schemas
// ============================================================

const newsSchema = z.object({
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
  overallSentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
  avgSentimentScore: z.number(),
});

const reportSchema = z.object({
  report: z.string(),
  sent: z.boolean(),
});

// ============================================================
// Helpers
// ============================================================

const sendEmailReport = async (ticker: string, report: string) => {
  console.log(`Sending ${ticker} report to ${RECIPIENT_EMAIL}...`);

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: RECIPIENT_EMAIL,
    subject: `Financial Report -- ${ticker}`,
    html: `<pre style="font-family: sans-serif; font-size: 14px;">${report}</pre>`,
  });

  if (error) {
    console.error('Email error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log('Email sent successfully:', data?.id);
};

const buildPrompt = (
  ticker: string,
  sentiment: string,
  score: number,
  articles: unknown,
  format: string
) => `
The sentiment for ${ticker} is ${sentiment} (score: ${score.toFixed(2)}).

Analyze these articles and produce a structured report:
${JSON.stringify(articles, null, 2)}

${format}
`.trim();

// ============================================================
// Report formats
// ============================================================

const BULLISH_FORMAT = `
Format:
🟢 OPPORTUNITY REPORT -- {ticker}
Overall Sentiment: Bullish

📈 KEY OPPORTUNITIES
- [List main positive catalysts]

📰 TOP STORIES
- [Summarize top 3 articles]

⚠️ RISKS TO WATCH
- [Any risks mentioned despite bullish sentiment]

💡 RECOMMENDATION
- [Brief actionable insight]
`.trim();

const BEARISH_FORMAT = `
Format:
🔴 RISK ALERT -- {ticker}
Overall Sentiment: Bearish

⚠️ KEY RISKS
- [List main negative factors]

📰 TOP STORIES
- [Summarize top 3 articles]

🛡️ DEFENSIVE CONSIDERATIONS
- [What to watch or hedge against]

💡 RECOMMENDATION
- [Brief actionable insight]
`.trim();

const NEUTRAL_FORMAT = `
Format:
🟡 MARKET SUMMARY -- {ticker}
Overall Sentiment: Neutral

📊 MARKET OVERVIEW
- [Balanced view of current situation]

📰 TOP STORIES
- [Summarize top 3 articles]

🔍 FACTORS TO WATCH
- [Key catalysts that could shift sentiment]

💡 RECOMMENDATION
- [Brief balanced insight]
`.trim();

// ============================================================
// Step 1 -- Fetch news from Alpha Vantage
// ============================================================

const fetchNews = createStep({
  id: 'fetch-news',
  description: 'Fetches recent financial news and sentiment for a ticker',
  inputSchema: z.object({
    ticker: z.string().describe('Stock ticker e.g. AAPL'),
  }),
  outputSchema: newsSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('Input data not found');

    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${inputData.ticker}&limit=5&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as {
      feed: {
        title: string;
        url: string;
        summary: string;
        overall_sentiment_label: string;
        overall_sentiment_score: number;
        time_published: string;
      }[];
    };

    if (!data.feed || data.feed.length === 0) {
      throw new Error(`No news found for ticker: ${inputData.ticker}`);
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
      ticker: inputData.ticker,
      articles,
      overallSentiment: overallSentiment as 'Bullish' | 'Bearish' | 'Neutral',
      avgSentimentScore,
    };
  },
});

// ============================================================
// Step 2a -- Bullish: Opportunity Report
// ============================================================

const opportunityReport = createStep({
  id: 'opportunity-report',
  description: 'Generates an opportunity report for bullish sentiment',
  inputSchema: newsSchema,
  outputSchema: reportSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('financialAgent');
    if (!agent) throw new Error('Financial agent not found');

    const prompt = buildPrompt(
      inputData.ticker,
      'BULLISH',
      inputData.avgSentimentScore,
      inputData.articles,
      BULLISH_FORMAT.replace('{ticker}', inputData.ticker)
    );

    const response = await agent.generate([{ role: 'user', content: prompt }]);
    await sendEmailReport(inputData.ticker, response.text);

    return { report: response.text, sent: true };
  },
});

// ============================================================
// Step 2b -- Bearish: Risk Alert
// ============================================================

const riskAlert = createStep({
  id: 'risk-alert',
  description: 'Generates a risk alert for bearish sentiment',
  inputSchema: newsSchema,
  outputSchema: reportSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('financialAgent');
    if (!agent) throw new Error('Financial agent not found');

    const prompt = buildPrompt(
      inputData.ticker,
      'BEARISH',
      inputData.avgSentimentScore,
      inputData.articles,
      BEARISH_FORMAT.replace('{ticker}', inputData.ticker)
    );

    const response = await agent.generate([{ role: 'user', content: prompt }]);
    await sendEmailReport(inputData.ticker, response.text);

    return { report: response.text, sent: true };
  },
});

// ============================================================
// Step 2c -- Neutral: Market Summary
// ============================================================

const standardReport = createStep({
  id: 'standard-report',
  description: 'Generates a standard report for neutral sentiment',
  inputSchema: newsSchema,
  outputSchema: reportSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('financialAgent');
    if (!agent) throw new Error('Financial agent not found');

    const prompt = buildPrompt(
      inputData.ticker,
      'NEUTRAL',
      inputData.avgSentimentScore,
      inputData.articles,
      NEUTRAL_FORMAT.replace('{ticker}', inputData.ticker)
    );

    const response = await agent.generate([{ role: 'user', content: prompt }]);
    await sendEmailReport(inputData.ticker, response.text);

    return { report: response.text, sent: true };
  },
});

// ============================================================
// Workflow -- fetch then branch by sentiment
// ============================================================

const financialWorkflow = createWorkflow({
  id: 'financial-workflow',
  inputSchema: z.object({
    ticker: z.string().describe('Stock ticker e.g. AAPL'),
  }),
  outputSchema: reportSchema,
})
  .then(fetchNews)
  .branch([
    [
      async ({ inputData }) => inputData.overallSentiment === 'Bullish',
      opportunityReport,
    ],
    [
      async ({ inputData }) => inputData.overallSentiment === 'Bearish',
      riskAlert,
    ],
    [
      async ({ inputData }) => inputData.overallSentiment === 'Neutral',
      standardReport,
    ],
  ]);

financialWorkflow.commit();

export { financialWorkflow };