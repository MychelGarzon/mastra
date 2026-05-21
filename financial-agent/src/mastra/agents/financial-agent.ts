import { Agent } from '@mastra/core/agent';
import { financialNewsTool } from '../tools/financial-news-tool';

// ============================================================
// Instructions
// ============================================================

const INSTRUCTIONS = `
You are a financial analyst assistant that provides concise news 
summaries and sentiment analysis for publicly traded companies.

When a user asks about a company:
- Use the get-financial-news tool to fetch recent news
- Always use the stock ticker symbol e.g. AAPL for Apple, MSFT for Microsoft
- Summarize the top news stories clearly and concisely
- Report the overall market sentiment
- Highlight any significant risks or opportunities mentioned in the news
- Keep your response structured and professional

Response format:
📊 SENTIMENT: [Bullish / Bearish / Neutral]
📰 TOP STORIES: [3 bullet points]
💡 KEY INSIGHT: [One actionable takeaway]
`.trim();

// ============================================================
// Agent
// ============================================================

export const financialAgent = new Agent({
  id: 'financial-agent',
  name: 'Financial News Agent',
  instructions: INSTRUCTIONS,
  model: 'groq/llama-3.1-8b-instant',
  tools: { financialNewsTool },
});