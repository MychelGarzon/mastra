import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { portfolioAgent } from "./agents/portfolio-agent";

// ============================================================
// Mastra Instance
// ============================================================

export const mastra = new Mastra({
  agents: { portfolioAgent },
  storage: new LibSQLStore({
    id: "portfolio-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
