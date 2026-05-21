# Financial News Agent

An AI-powered financial news analysis system built with Mastra, TypeScript, and Bun.
The agent fetches real-time financial news, performs sentiment analysis, and delivers
structured reports via email -- automatically routing to different report types based
on market sentiment.

## Architecture

User Input (ticker symbol)
↓
fetchNews (Alpha Vantage API)
↓
Sentiment Analysis (Bullish / Bearish / Neutral)
↓
.branch()
├── Bullish → Opportunity Report 🟢
├── Bearish → Risk Alert 🔴
└── Neutral → Market Summary 🟡
↓
Email Delivery (Resend)

## Key Concepts

**Agent vs Workflow separation** -- the agent handles open-ended natural language
queries via chat. The workflow handles deterministic, structured pipelines where
execution order and branching logic are controlled in code, not by the LLM. This
separation is critical for production fintech systems where reliability matters.

**Sentiment-driven branching** -- sentiment score is calculated deterministically
from raw API data before the LLM is involved. The LLM only handles report generation,
not routing decisions.

**Tool calling** -- the agent uses a custom tool to fetch financial data from
Alpha Vantage. The tool has typed inputs and outputs via Zod schemas, ensuring
structured, validated data flows through the system.

## Stack

- [Mastra](https://mastra.ai) -- AI agent and workflow framework
- TypeScript + Bun -- runtime and language
- Groq (llama-3.1-8b-instant) -- LLM for report generation
- Alpha Vantage API -- financial news and sentiment data
- Resend -- email delivery

## Project Structure

src/mastra/
├── agents/
│ └── financial-agent.ts # Agent with tool calling for chat interface
├── tools/
│ └── financial-news-tool.ts # Alpha Vantage API integration
├── workflows/
│ └── financial-workflow.ts # Sentiment branching workflow + email delivery
└── index.ts # Mastra instance registration

## Getting Started

### Prerequisites

- Node.js 22+
- Bun 1.0+

### Installation

```bash
bun install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

GROQ_API_KEY= # https://console.groq.com
ALPHAVANTAGE_API_KEY= # https://www.alphavantage.co/support/#api-key
RESEND_API_KEY= # https://resend.com

### Run

```bash
bun run dev
```

Open Mastra Studio at `http://localhost:4111`

## Usage

### Chat Interface

Ask the agent directly in Mastra Studio:
What is the latest news about Apple?
What is the sentiment for MSFT?

### Workflow

Run the `financial-workflow` in Mastra Studio with any ticker symbol:
AAPL
TSLA
MSFT

The workflow will fetch news, analyze sentiment, generate a structured report,
and send it to your configured email address.

## Report Types

**🟢 Opportunity Report** (Bullish sentiment > 0.35)

- Key opportunities and positive catalysts
- Top bullish news stories
- Risks to watch despite positive sentiment

**🔴 Risk Alert** (Bearish sentiment < -0.35)

- Key risks and negative factors
- Top bearish news stories
- Defensive considerations

**🟡 Market Summary** (Neutral sentiment)

- Balanced market overview
- Top stories
- Factors that could shift sentiment either way
