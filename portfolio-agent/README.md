# Portfolio Agent

A conversational AI assistant that connects directly to a Postgres database
and answers natural language questions about your stock portfolio. Ask about
holdings, transactions, watchlist, and portfolio performance -- no SQL required.

## Architecture

```
User asks in natural language
        ↓
Agent reasons about the question
        ↓
Selects the right tool
        ↓
Tool queries Neon Postgres database
        ↓
Agent formats results in natural language
        ↓
User gets a human-friendly answer
```

## Example Conversations

```
"What stocks do I own?"
"What is my total portfolio value?"
"Show me my tech stocks"
"When did I buy Apple?"
"What is on my watchlist?"
"Which sector am I most exposed to?"
"Show me all my transactions"
"What is my biggest position?"
```

## Key Design Decisions

**Tool per query type** -- each tool handles one specific database operation.
The agent decides which tool to call based on the user's question. This keeps
tools small, testable, and easy to extend.

**No raw SQL in the agent** -- the agent never writes SQL. SQL lives in tools,
which means it is typed, validated, and version controlled. The agent only
reasons about what to ask, not how to ask it.

**Typed query results** -- every database response is typed with TypeScript
interfaces and validated with Zod schemas before reaching the agent. This
prevents hallucination from malformed data.

**Conversational by design** -- the agent is configured to respond in natural
language, format numbers with $ and %, and maintain context across the
conversation. It feels like talking to a financial advisor, not querying a database.

## Stack

- [Mastra](https://mastra.ai) -- AI agent framework
- TypeScript + Bun -- runtime and language
- Groq (llama-3.3-70b-versatile) -- LLM for natural language responses
- Neon -- serverless Postgres database
- Zod -- schema validation

## Project Structure

```
src/mastra/
├── agents/
│   └── portfolio-agent.ts     # Agent with all tools and instructions
├── tools/
│   └── portfolio-tool.ts      # Five database query tools
├── db/
│   ├── client.ts              # Postgres connection pool and query helper
│   ├── schema.sql             # Database schema (holdings, transactions, watchlist)
│   └── seed.sql               # Sample portfolio data
└── index.ts                   # Mastra instance registration
```

## Database Schema

### holdings

Stocks currently owned in the portfolio.

| Column        | Type         | Description            |
| ------------- | ------------ | ---------------------- |
| id            | SERIAL       | Primary key            |
| ticker        | VARCHAR(10)  | Stock ticker e.g. AAPL |
| company       | VARCHAR(100) | Company name           |
| shares        | DECIMAL      | Number of shares owned |
| avg_buy_price | DECIMAL      | Average purchase price |
| sector        | VARCHAR(50)  | Sector e.g. Technology |
| created_at    | TIMESTAMP    | Record creation time   |

### transactions

Full buy and sell history.

| Column     | Type        | Description          |
| ---------- | ----------- | -------------------- |
| id         | SERIAL      | Primary key          |
| ticker     | VARCHAR(10) | Stock ticker         |
| type       | VARCHAR(4)  | buy or sell          |
| shares     | DECIMAL     | Number of shares     |
| price      | DECIMAL     | Price per share      |
| total      | DECIMAL     | Computed total value |
| notes      | TEXT        | Optional trade notes |
| created_at | TIMESTAMP   | Transaction date     |

### watchlist

Stocks being monitored with target prices.

| Column       | Type         | Description          |
| ------------ | ------------ | -------------------- |
| id           | SERIAL       | Primary key          |
| ticker       | VARCHAR(10)  | Stock ticker         |
| company      | VARCHAR(100) | Company name         |
| target_price | DECIMAL      | Target buy price     |
| notes        | TEXT         | Optional notes       |
| created_at   | TIMESTAMP    | Record creation time |

## Tools

| Tool                   | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| get-holdings           | All current stock positions                          |
| get-holdings-by-sector | Positions filtered by sector                         |
| get-transactions       | Full buy/sell history, optionally filtered by ticker |
| get-watchlist          | Stocks being monitored with target prices            |
| get-portfolio-summary  | High level overview with sector breakdown            |

## Getting Started

### Prerequisites

- Node.js 22+
- Bun 1.0+
- Neon account (free at https://neon.tech)

### Installation

```bash
bun install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```
GROQ_API_KEY=        # https://console.groq.com
DATABASE_URL=        # postgresql://user:password@host/db?sslmode=require
```

### Database Setup

Run the schema and seed files in your Neon SQL Editor:

1. Go to https://console.neon.tech
2. Click SQL Editor
3. Run `src/mastra/db/schema.sql`
4. Run `src/mastra/db/seed.sql`

### Run

```bash
bun run dev
```

Open Mastra Studio at `http://localhost:4111` and start chatting.

## Author

Mychel Garzon

- [LinkedIn](https://www.linkedin.com/in/mychel-garzon-trujillo/)
- [AutomiQ](https://www.automiq.fi/)
- n8n Verified Creator and Community Ambassador Helsinki
- Junction 2025 n8n Tech Challenge Winner
