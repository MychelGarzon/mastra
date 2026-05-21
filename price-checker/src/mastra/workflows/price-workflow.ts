import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Resend } from "resend";
import { z } from "zod";

// ============================================================
// Config
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = "mychel.garzon@gmail.com";

// ============================================================
// Schemas
// ============================================================

const priceSchema = z.object({
  ticker: z.string(),
  currentPrice: z.number(),
  previousClose: z.number(),
  change: z.number(),
  changePercent: z.number(),
  direction: z.enum(["up", "down", "flat"]),
  alertThreshold: z.number(),
});

const reportSchema = z.object({
  report: z.string(),
  alerted: z.boolean(),
  sent: z.boolean(),
});

// ============================================================
// Helpers
// ============================================================

const sendEmail = async (ticker: string, subject: string, report: string) => {
  console.log(`Sending email for ${ticker}...`);

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: RECIPIENT_EMAIL,
    subject,
    html: `<pre style="font-family: sans-serif; font-size: 14px;">${report}</pre>`,
  });

  if (error) {
    console.error("Email error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("Email sent:", data?.id);
};

const sendSlack = async (message: string) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("SLACK_WEBHOOK_URL is not set");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }

  console.log("Slack alert sent");
};

// ============================================================
// Step 1 -- Fetch price from Alpha Vantage
// ============================================================

const fetchPrice = createStep({
  id: "fetch-price",
  description: "Fetches current price and daily change for a ticker",
  inputSchema: z.object({
    ticker: z.string().describe("Stock or crypto ticker e.g. AAPL, BTC"),
    alertThreshold: z
      .number()
      .describe("% change that triggers an alert e.g. 2.5"),
  }),
  outputSchema: priceSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error("Input data not found");

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${inputData.ticker}&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as {
      "Global Quote": {
        "01. symbol": string;
        "05. price": string;
        "08. previous close": string;
        "09. change": string;
        "10. change percent": string;
      };
    };

    const quote = data?.["Global Quote"];

    if (!quote?.["05. price"]) {
      throw new Error(`No price data found for ticker: ${inputData.ticker}`);
    }

    const currentPrice = Number.parseFloat(quote["05. price"]);
    const previousClose = Number.parseFloat(quote["08. previous close"]);
    const change = Number.parseFloat(quote["09. change"]);
    const changePercent = Number.parseFloat(
      quote["10. change percent"].replace("%", ""),
    );

    const getDirection = (c: number): "up" | "down" | "flat" => {
      if (c > 0) return "up";
      if (c < 0) return "down";
      return "flat";
    };

    return {
      ticker: inputData.ticker,
      currentPrice,
      previousClose,
      change,
      changePercent,
      direction: getDirection(change),
      alertThreshold: inputData.alertThreshold,
    };
  },
});

// ============================================================
// Step 2a -- Alert path (email + Slack)
// ============================================================

const alertPath = createStep({
  id: "alert-path",
  description: "Sends email and Slack alert for significant price movement",
  inputSchema: priceSchema,
  outputSchema: reportSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("priceAgent");
    if (!agent) throw new Error("Price agent not found");

    const prompt = `
Generate a PRICE ALERT for ${inputData.ticker}:
- Current Price: $${inputData.currentPrice}
- Previous Close: $${inputData.previousClose}
- Change: ${inputData.change > 0 ? "+" : ""}${inputData.change.toFixed(2)}
- Change %: ${inputData.changePercent.toFixed(2)}%
- Direction: ${inputData.direction}
- Alert Threshold: ${inputData.alertThreshold}%

Format:
🚨 PRICE ALERT -- ${inputData.ticker}

💰 CURRENT PRICE: $[price]
📊 CHANGE: [+/-][amount] ([%] vs yesterday)
📈 DIRECTION: [up/down/flat]

⚠️ WHY THIS MATTERS
- [Brief explanation of the movement significance]

💡 WHAT TO WATCH
- [Key factors to monitor]
    `.trim();

    const response = await agent.generate([{ role: "user", content: prompt }]);

    const slackMessage = `🚨 *PRICE ALERT -- ${inputData.ticker}* | $${inputData.currentPrice} | ${inputData.changePercent.toFixed(2)}% ${inputData.direction === "up" ? "📈" : "📉"} | Threshold: ${inputData.alertThreshold}%`;

    await sendEmail(
      inputData.ticker,
      `🚨 Price Alert -- ${inputData.ticker}`,
      response.text,
    );
    await sendSlack(slackMessage);

    return { report: response.text, alerted: true, sent: true };
  },
});

// ============================================================
// Step 2b -- Summary path (email only)
// ============================================================

const summaryPath = createStep({
  id: "summary-path",
  description: "Sends email summary for normal price movement",
  inputSchema: priceSchema,
  outputSchema: reportSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("priceAgent");
    if (!agent) throw new Error("Price agent not found");

    const prompt = `
Generate a PRICE SUMMARY for ${inputData.ticker}:
- Current Price: $${inputData.currentPrice}
- Previous Close: $${inputData.previousClose}
- Change: ${inputData.change > 0 ? "+" : ""}${inputData.change.toFixed(2)}
- Change %: ${inputData.changePercent.toFixed(2)}%
- Direction: ${inputData.direction}

Format:
📊 PRICE SUMMARY -- ${inputData.ticker}

💰 CURRENT PRICE: $[price]
📊 CHANGE: [+/-][amount] ([%] vs yesterday)
📈 DIRECTION: [up/down/flat]

🔍 MARKET CONTEXT
- [Brief context about the price movement]

💡 FACTORS TO WATCH
- [Key things to monitor going forward]
    `.trim();

    const response = await agent.generate([{ role: "user", content: prompt }]);

    await sendEmail(
      inputData.ticker,
      `📊 Price Summary -- ${inputData.ticker}`,
      response.text,
    );

    return { report: response.text, alerted: false, sent: true };
  },
});

// ============================================================
// Workflow -- fetch price then branch by threshold
// ============================================================

const priceWorkflow = createWorkflow({
  id: "price-workflow",
  inputSchema: z.object({
    ticker: z.string().describe("Stock or crypto ticker e.g. AAPL, BTC"),
    alertThreshold: z
      .number()
      .describe("% change that triggers an alert e.g. 2.5"),
  }),
  outputSchema: reportSchema,
})
  .then(fetchPrice)
  .branch([
    [
      async ({ inputData }) =>
        Math.abs(inputData.changePercent) > inputData.alertThreshold,
      alertPath,
    ],
    [
      async ({ inputData }) =>
        Math.abs(inputData.changePercent) <= inputData.alertThreshold,
      summaryPath,
    ],
  ]);

priceWorkflow.commit();

export { priceWorkflow };
