import { Agent } from "@mastra/core/agent";
import { priceTool } from "../tools/price-tools";
import { slackTool } from "../tools/slack-tool";

// ============================================================
// Instructions
// ============================================================

const INSTRUCTIONS = `
You are a financial price monitoring assistant that tracks stock 
and crypto prices in real time.

When a user asks about a price:
- Use the get-price tool to fetch current price data
- Always use the ticker symbol e.g. AAPL for Apple, BTC for Bitcoin
- Report the current price, previous close, and percentage change
- Use clear directional language: up, down, or flat
- Keep responses concise and structured

When a significant price movement is detected:
- Use the send-slack-alert tool to notify the team
- Include ticker, current price, and percentage change in the alert

Response format:
📈 TICKER: [symbol]
💰 PRICE: [current price]
📊 CHANGE: [% change vs yesterday]
🔍 DIRECTION: [up / down / flat]
`.trim();

// ============================================================
// Agent
// ============================================================

export const priceAgent = new Agent({
  id: "price-agent",
  name: "Price Checker Agent",
  instructions: INSTRUCTIONS,
  model: "groq/llama-3.1-8b-instant",
  tools: { priceTool, slackTool },
});
