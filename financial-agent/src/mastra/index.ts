import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { financialAgent } from './agents/financial-agent';
import { financialWorkflow } from './workflows/financial-workflow';

export const mastra = new Mastra({
  agents: { financialAgent },
  workflows: { financialWorkflow },
  storage: new LibSQLStore({
  id: 'financial-storage',
  url: 'file:./mastra.db',
}),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});