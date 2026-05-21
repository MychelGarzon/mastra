import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ============================================================
// Helpers
// ============================================================

const sendSlackMessage = async (message: string) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is not set");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
};

// ============================================================
// Tool
// ============================================================

export const slackTool = createTool({
  id: "send-slack-alert",
  description: "Sends a price alert message to a Slack channel via webhook",
  inputSchema: z.object({
    message: z.string().describe("The alert message to send to Slack"),
  }),
  outputSchema: z.object({
    sent: z.boolean(),
  }),
  execute: async ({ message }: { message: string }) => {
    await sendSlackMessage(message);
    return { sent: true };
  },
});
