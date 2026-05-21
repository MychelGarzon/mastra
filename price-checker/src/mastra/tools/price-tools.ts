import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ============================================================
// Types
// ============================================================

interface AlphaVantageQuoteResponse {
  "Global Quote": {
    "01. symbol": string;
    "05. price": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
}

// ============================================================
// Schemas
// ============================================================

export const priceDataSchema = z.object({
  ticker: z.string(),
  currentPrice: z.number(),
  previousClose: z.number(),
  change: z.number(),
  changePercent: z.number(),
  direction: z.enum(["up", "down", "flat"]),
});

// ============================================================
// Helpers
// ============================================================

const getDirection = (change: number): "up" | "down" | "flat" => {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
};

const fetchQuote = async (
  ticker: string,
): Promise<AlphaVantageQuoteResponse> => {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;
  const response = await fetch(url);
  return response.json();
};

// ============================================================
// Tool
// ============================================================

export const priceTool = createTool({
  id: "get-price",
  description:
    "Fetches current price and daily change for a stock or crypto ticker",
  inputSchema: z.object({
    ticker: z.string().describe("Stock or crypto ticker e.g. AAPL, BTC, ETH"),
  }),
  outputSchema: priceDataSchema,
  execute: async ({ ticker }: { ticker: string }) => {
    const data = await fetchQuote(ticker);
    const quote = data["Global Quote"];

    if (!quote?.["05. price"]) {
      throw new Error(`No price data found for ticker: ${ticker}`);
    }

    const currentPrice = Number.parseFloat(quote["05. price"]);
    const previousClose = Number.parseFloat(quote["08. previous close"]);
    const change = Number.parseFloat(quote["09. change"]);
    const changePercent = Number.parseFloat(
      quote["10. change percent"].replace("%", ""),
    );

    return {
      ticker,
      currentPrice,
      previousClose,
      change,
      changePercent,
      direction: getDirection(change),
    };
  },
});
