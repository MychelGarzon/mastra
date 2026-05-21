import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { priceAgent } from "./agents/price-agent";
import { priceWorkflow } from "./workflows/price-workflow";

export const mastra = new Mastra({
  agents: { priceAgent },
  workflows: { priceWorkflow },
  storage: new LibSQLStore({
    id: "price-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
