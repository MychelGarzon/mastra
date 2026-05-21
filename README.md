# Mastra AI Agent Portfolio

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

## Architecture Philosophy

These projects follow a core principle for production AI systems:

**Agents** handle open-ended reasoning -- chat interfaces,
natural language queries, flexible responses.

**Workflows** handle deterministic logic -- branching,
sequencing, compliance-adjacent operations where execution
order must be guaranteed.

This separation is especially critical in fintech where
reliability and auditability matter.

## Author

Mychel Garzon

- [LinkedIn](https://www.linkedin.com/in/mychel-garzon-trujillo/)
- [AutomiQ](https://www.automiq.fi/)
- n8n Verified Creator and Community Ambassador Helsinki
- Junction 2025 n8n Tech Challenge Winner
