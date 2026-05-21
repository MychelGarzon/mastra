import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { query } from "../db/client";

// ============================================================
// Types
// ============================================================

interface Holding {
  id: number;
  ticker: string;
  company: string;
  shares: number;
  avg_buy_price: number;
  sector: string;
  created_at: Date;
}

interface Transaction {
  id: number;
  ticker: string;
  type: string;
  shares: number;
  price: number;
  total: number;
  notes: string;
  created_at: Date;
}

interface Watchlist {
  id: number;
  ticker: string;
  company: string;
  target_price: number;
  notes: string;
  created_at: Date;
}

// ============================================================
// Tool 1 -- Get all holdings
// ============================================================

export const getHoldingsTool = createTool({
  id: "get-holdings",
  description: "Fetches all current stock holdings in the portfolio",
  inputSchema: z.object({}),
  outputSchema: z.object({
    holdings: z.array(
      z.object({
        ticker: z.string(),
        company: z.string(),
        shares: z.number(),
        avg_buy_price: z.number(),
        sector: z.string(),
      }),
    ),
    total: z.number(),
  }),
  execute: async () => {
    const holdings = await query<Holding>(
      "SELECT * FROM holdings ORDER BY sector, ticker",
    );

    return {
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        company: h.company,
        shares: Number(h.shares),
        avg_buy_price: Number(h.avg_buy_price),
        sector: h.sector,
      })),
      total: holdings.length,
    };
  },
});

// ============================================================
// Tool 2 -- Get holdings by sector
// ============================================================

export const getHoldingsBySectorTool = createTool({
  id: "get-holdings-by-sector",
  description: "Fetches holdings filtered by sector e.g. Technology, Finance",
  inputSchema: z.object({
    sector: z
      .string()
      .describe("Sector name e.g. Technology, Finance, Healthcare"),
  }),
  outputSchema: z.object({
    sector: z.string(),
    holdings: z.array(
      z.object({
        ticker: z.string(),
        company: z.string(),
        shares: z.number(),
        avg_buy_price: z.number(),
      }),
    ),
  }),
  execute: async ({ sector }: { sector: string }) => {
    const holdings = await query<Holding>(
      "SELECT * FROM holdings WHERE LOWER(sector) = LOWER($1) ORDER BY ticker",
      [sector],
    );

    return {
      sector,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        company: h.company,
        shares: Number(h.shares),
        avg_buy_price: Number(h.avg_buy_price),
      })),
    };
  },
});

// ============================================================
// Tool 3 -- Get transactions
// ============================================================

export const getTransactionsTool = createTool({
  id: "get-transactions",
  description: "Fetches transaction history, optionally filtered by ticker",
  inputSchema: z.object({
    ticker: z
      .string()
      .optional()
      .describe("Stock ticker to filter by e.g. AAPL"),
  }),
  outputSchema: z.object({
    transactions: z.array(
      z.object({
        ticker: z.string(),
        type: z.string(),
        shares: z.number(),
        price: z.number(),
        total: z.number(),
        notes: z.string(),
        created_at: z.string(),
      }),
    ),
    total: z.number(),
  }),
  execute: async ({ ticker }: { ticker?: string }) => {
    const transactions = ticker
      ? await query<Transaction>(
          "SELECT * FROM transactions WHERE UPPER(ticker) = UPPER($1) ORDER BY created_at DESC",
          [ticker],
        )
      : await query<Transaction>(
          "SELECT * FROM transactions ORDER BY created_at DESC",
        );

    return {
      transactions: transactions.map((t) => ({
        ticker: t.ticker,
        type: t.type,
        shares: Number(t.shares),
        price: Number(t.price),
        total: Number(t.total),
        notes: t.notes ?? "",
        created_at: t.created_at.toString(),
      })),
      total: transactions.length,
    };
  },
});

// ============================================================
// Tool 4 -- Get watchlist
// ============================================================

export const getWatchlistTool = createTool({
  id: "get-watchlist",
  description: "Fetches all stocks on the watchlist with target prices",
  inputSchema: z.object({}),
  outputSchema: z.object({
    watchlist: z.array(
      z.object({
        ticker: z.string(),
        company: z.string(),
        target_price: z.number(),
        notes: z.string(),
      }),
    ),
    total: z.number(),
  }),
  execute: async () => {
    const watchlist = await query<Watchlist>(
      "SELECT * FROM watchlist ORDER BY ticker",
    );

    return {
      watchlist: watchlist.map((w) => ({
        ticker: w.ticker,
        company: w.company,
        target_price: Number(w.target_price),
        notes: w.notes ?? "",
      })),
      total: watchlist.length,
    };
  },
});

// ============================================================
// Tool 5 -- Get portfolio summary
// ============================================================

export const getPortfolioSummaryTool = createTool({
  id: "get-portfolio-summary",
  description:
    "Returns a high level summary of the portfolio including total invested value and sector breakdown",
  inputSchema: z.object({}),
  outputSchema: z.object({
    totalInvested: z.number(),
    totalPositions: z.number(),
    sectors: z.array(
      z.object({
        sector: z.string(),
        positions: z.number(),
        invested: z.number(),
      }),
    ),
  }),
  execute: async () => {
    const holdings = await query<Holding>(
      "SELECT * FROM holdings ORDER BY sector",
    );

    const totalInvested = holdings.reduce(
      (sum, h) => sum + Number(h.shares) * Number(h.avg_buy_price),
      0,
    );

    const sectorMap = new Map<
      string,
      { positions: number; invested: number }
    >();

    for (const h of holdings) {
      const existing = sectorMap.get(h.sector) ?? { positions: 0, invested: 0 };
      sectorMap.set(h.sector, {
        positions: existing.positions + 1,
        invested:
          existing.invested + Number(h.shares) * Number(h.avg_buy_price),
      });
    }

    const sectors = Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      positions: data.positions,
      invested: Math.round(data.invested * 100) / 100,
    }));

    return {
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalPositions: holdings.length,
      sectors,
    };
  },
});
