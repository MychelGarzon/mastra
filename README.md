# Mastra AI Agents

A collection of production-grade AI agent systems built with
[Mastra](https://mastra.ai), TypeScript, and Bun.

Each project demonstrates real agentic architecture patterns:
deterministic workflows, LLM orchestration, tool calling,
retrieval, and external API integration.

## Projects

### 🏦 [Financial News Agent](./financial-agent)

An AI-powered financial analysis system that fetches real-time
news, performs sentiment analysis, and delivers structured reports
via email.

**Key patterns:**

- Sentiment-driven workflow branching (Bullish / Bearish / Neutral)
- Agent vs workflow separation for production reliability
- Tool calling with typed Zod schemas
- External API integration (Alpha Vantage, Resend)

**Stack:** Mastra, TypeScript, Bun, Groq, Alpha Vantage, Resend

---

### 📈 [Price Checker Agent](./price-checker)

An AI-powered stock and crypto price monitoring system that fetches
real-time prices, compares against a configurable alert threshold,
and delivers structured reports via email and Slack.

**Key patterns:**

- Threshold-based workflow branching (alert vs summary)
- Deterministic math decisions before LLM involvement
- Dual notification channels (email + Slack)
- Real-time price data integration (Alpha Vantage)

**Stack:** Mastra, TypeScript, Bun, Groq, Alpha Vantage, Resend, Slack

---

## Architecture Philosophy

These projects follow a core principle for production AI systems:

**Agents** handle open-ended reasoning -- chat interfaces,
natural language queries, flexible responses.

**Workflows** handle deterministic logic -- branching,
sequencing, compliance-adjacent operations where execution
order must be guaranteed.

This separation is especially critical in fintech where
reliability and auditability matter.

### Decision Framework

```
Is the logic open-ended or conversational?
  YES → Use an Agent
  NO  → Is the execution order guaranteed?
          YES → Use a Workflow
          NO  → Combine both
```

### Data Flow Pattern

```
External API (data layer)
      ↓
Tool (typed, validated via Zod)
      ↓
Workflow Step (deterministic logic)
      ↓
Branch (business rules, no LLM)
      ↓
Agent (LLM reasoning, report generation)
      ↓
Notification (email, Slack)
```

## Tech Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Framework      | Mastra                      |
| Language       | TypeScript                  |
| Runtime        | Bun                         |
| LLM            | Groq (llama-3.1-8b-instant) |
| Financial Data | Alpha Vantage               |
| Email          | Resend                      |
| Alerts         | Slack Webhooks              |
| Validation     | Zod                         |

## Getting Started

### Prerequisites

- Node.js 22+
- Bun 1.0+

### Clone and install

```bash
git clone https://github.com/MychelGarzon/mastra.git
cd mastra
```

Each project is self-contained. Navigate into any project and install:

```bash
cd financial-agent
bun install
cp .env.example .env
bun run dev
```

### Environment Variables

Each project requires its own `.env` file. Copy `.env.example` and fill in:

```
GROQ_API_KEY=           # https://console.groq.com
ALPHAVANTAGE_API_KEY=   # https://www.alphavantage.co/support/#api-key
RESEND_API_KEY=         # https://resend.com
SLACK_WEBHOOK_URL=      # https://api.slack.com/apps (price-checker only)
```

## Author

Mychel Garzon

- [LinkedIn](https://www.linkedin.com/in/mychel-garzon-trujillo/)
- [AutomiQ](https://www.automiq.fi/)
- n8n Verified Creator and Community Ambassador Helsinki
- Junction 2025 n8n Tech Challenge Winner
