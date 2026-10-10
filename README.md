# Wayfind

**AI Agent Infrastructure for Tokenized Stocks on Solana & Across Web3**

## Product Overview

Wayfind gives AI agents the market data, portfolio intelligence, and trading tools they need to understand and manage tokenized stocks on Solana.

Use ready-to-run Grok Bot templates to analyze holdings, assess portfolio risk, execute supported trades, and rebalance positions. Under the hood, Wayfind combines tokenized-asset data from CoinMarketCap, personalized risk context, and OKX DEX trading integrations to help agents make decisions beyond ticker symbols alone.

## What You Can Do

* **Trade with Grok Bot** — Use Wayfind templates to interact with tokenized stocks through natural-language instructions.
* **Rebalance a Portfolio** — Use portfolio context and trading tools to adjust supported positions.
* **Understand Portfolio Risk** — Generate personalized risk assessments, scores, and factor breakdowns.
* **Explore Tokenized Stocks** — Discover assets and inspect market data across supported networks.
* **Give AI Agents Better Data** — Access tokenized-asset intelligence through Wayfind's data layer and agent integrations.

## Background

Tokenized equities are becoming a growing part of the real-world asset market. CoinGecko reported approximately $0.5B in tokenized equity market capitalization by Q1 2026, alongside $15.1B in spot trading volume during the quarter.

Simply putting stocks onchain isn't enough. The real unlock comes when AI agents can understand what they're holding, evaluate risk in context, and act on it. Wayfind gives Grok Bot the data layer and trading integrations to do exactly that — turning tokenized equities into something agents can actually trade.

### The Problem

**AI agents can't trade what they don't understand.**

A tokenized stock isn't just a ticker symbol onchain — it represents exposure to a real company with revenue, earnings, business fundamentals, and issuer risk. One company like Tesla can have multiple onchain versions (TSLAx, TSLAon, rTSLA) with different prices, liquidity, and issuers.

Without market data, risk context, and trading integrations, agents are flying blind. Wayfind gives them the intelligence to evaluate what they hold, assess portfolio risk, and act on it.

## System Overview

| Component | Repository | Description |
|-----------|-----------|-------------|
| **Platform** | [wayfind](https://github.com/tamago-labs/wayfind) | Next.js dashboard + AWS Amplify backend (Lambda, DynamoDB, scheduled trackers). Handles portfolio tracking, AI risk analysis, and market data ingestion. |
| **MCP Server** | [wayfind-mcp](https://github.com/tamago-labs/wayfind-mcp) | MCP tools: wallet balances, swap quotes, tokenized stock data, risk profiles, agentic wallet. Published as `@tamago-labs/wayfind-mcp` on npm. |
| **Agent Skills** | [wayfind-skills](https://github.com/tamago-labs/wayfind-skills) | Grok Bot plugin + skill definitions. Provides intent routing, setup guides, and tool references for AI agents. |

The platform is the data backbone — ingesting market data, running AI risk analysis, and persisting results. The MCP server is the agent interface — exposing wallet operations, market queries, and OKX DEX swaps as callable tools. The skills layer is the agent's playbook — defining how to route intents, configure env vars, and execute multi-step workflows. An agent with the Wayfind skill installed can go from "check my TSLAx balance" to "rebalance my portfolio" without leaving the chat.

## User Flow

### 1. Build Your Risk Profile
* Answer a short AI questionnaire about your goals, time horizon, and risk tolerance
* Wayfind creates a personalized risk profile that defines what risk means for you

### 2. Get Your API Key
* Your API key is tied to your risk profile
* Set it as the default so every bot you deploy inherits your risk intelligence automatically

### 3. Set Up Your Bot
* Import a Grok Bot template from the Wayfind landing page
* Set your API key and create an agentic wallet on the bot's computer
* Ask your agent anything — from listing every TSLA token to fetching live prices

### 4. Auto-Rebalance to Risk Profile
* Your bot monitors your portfolio and rebalances automatically to match your risk profile
* The AI Risk Engine evaluates fundamentals, market exposure, concentration, liquidity, issuer risk, and onchain factors
* Swapping through the OKX DEX Router when positions drift

## Backend

Wayfind's backend uses **AWS Amplify Gen 2** with serverless functions, DynamoDB tables, and scheduled data ingestion.

### Data Models

| Model | Purpose |
|-------|---------|
| **PriceSnapshot** | Stores CoinMarketCap market data per tokenized stock (price, market_cap, volume_24h, percent changes, supply). Updated hourly by scheduled tracker. |
| **PreStock** | Tracks pre-IPO token valuations (markPrice, tokenPrice, markValuation, impliedValuation, supply). Updated hourly from PreStocks API. |
| **UserProfile** | User profiles with wallet address, AI credits, experience level, writing style, and linked portfolios/reviews. |
| **Portfolio** | User-created portfolios (real or simulated) with custom token allocations. |
| **SavedReview** | Persists AI-generated risk reviews per portfolio, including risk score, factor breakdown, hidden risks, and chat history. |
| **AgentSession** | Stores chat conversation history for the multi-agent AI chat system. |

### Scheduled Trackers

| Function | Purpose | Frequency |
|----------|---------|-----------|
| **price-tracker** | Fetches market data from CoinMarketCap Pro for all configured tokenized stocks. Stores price, market cap, volume, and percentage changes. | Hourly |
| **prestock-tracker** | Pulls latest valuations from PreStocks API for pre-IPO tokens. Updates markPrice, tokenPrice, and valuations. | Hourly |
| **ohlcv-fetcher** | Retrieves historical OHLCV data from CoinMarketCap for price charts and trend analysis. | On demand |

### Lambda Functions

| Function | Purpose |
|----------|---------|
| **risk-review** | Main entry point for the AI Risk Engine. Runs the two-turn risk analysis pipeline (questionnaire → risk evaluation). Returns comprehensive portfolio risk scores with factor breakdown. |
| **chat-further** | SSE streaming Lambda for post-review AI chat. Triage agent hands off to specialist agents (market research, news intelligence, pre-IPO markets). Powered by OpenAI Agents SDK. |
| **ohlcv-fetcher** | Retrieves historical price data from CoinMarketCap for chart rendering. |

## CoinMarketCap API Integration

Wayfind uses CoinMarketCap Pro API across 3 categories: Real World Assets (RWA), Cryptocurrency quotes, and OHLCV historical data.

### Endpoints Used

| File | CMC Endpoint | Purpose |
|------|-------------|---------|
| `scripts/fetch-all.ts` | `GET /v5/real-world-assets/map` | List all stock RWAs with pagination |
| `scripts/rwa-filter.ts` | `GET /v5/real-world-assets/quotes/latest` | Filter active stocks by price > 0 |
| `scripts/rwa-info-final.ts` | `GET /v5/real-world-assets/info` | Fetch metadata (website, industry, description) |
| `app/api/crypto-prices/route.ts` | `GET /v2/cryptocurrency/quotes/latest` | Client-side base token prices (SOL, USDC, USDT) |
| `amplify/functions/price-tracker/handler.ts` | `GET /v2/cryptocurrency/quotes/latest` | Scheduled batch price tracking for all RWA tokens |
| `amplify/functions/ohlcv-fetcher/handler.ts` | `GET /v2/cryptocurrency/ohlcv/historical` | OHLCV historical data for price charts |

### Frontend Data Consumers

| File | Source | Purpose |
|------|--------|---------|
| `contexts/BaseTokenPriceProvider.tsx` | Calls `/api/crypto-prices` | React context providing base token prices |
| `app/dashboard/explore/page.tsx` | Reads `PriceSnapshot` from DB | Displays CMC-sourced price data in explore table |
| `components/dashboard/portfolio/*` | Reads prices from context/DB | Portfolio stats, holdings with live values |
| `components/dashboard/token-detail/*` | Reads `PriceSnapshot` from DB | Token detail pages with price history |

### Evidence of Real API Calls

#### 1. RWA Map — Discover Tokenized Stocks

**Code** (`scripts/fetch-all.ts`):
```typescript
const url = new URL(`${BASE_URL}/v5/real-world-assets/map`);
url.searchParams.set("asset_type", "stock");
url.searchParams.set("limit", "250");
url.searchParams.set("start", String(start));
url.searchParams.set("sort", "rwa_rank");

const res = await fetch(url.toString(), {
  headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, Accept: "application/json" },
});
```

**Response**:
```json
{
  "data": {
    "rwa_assets": [
      {
        "name": "Nvidia Corp",
        "symbol": "NVDA",
        "slug": "nvidia",
        "rwa_id": 2,
        "rwa_rank": 2,
        "has_tokens": true
      },
      {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "rwa_id": 3,
        "rwa_rank": 3
      }
    ],
    "total_size": 4686
  }
}
```

#### 2. RWA Quotes — Live Tokenized Prices

**Code** (`scripts/rwa-filter.ts`):
```typescript
const url = new URL(`${BASE_URL}/v5/real-world-assets/quotes/latest`);
url.searchParams.set("symbol", symbols.join(","));
url.searchParams.set("convert", "USD");
```

**Response**:
```json
{
  "data": {
    "rwa_assets": [
      {
        "symbol": "NVDA",
        "name": "Nvidia Corp",
        "average_tokenized_price": 230.48,
        "tokenized_market_cap": 136929862.56,
        "tokenized_volume_24h": 177615573.63,
        "tokens": [
          { "symbol": "NVDAX", "price": 230.49, "issuer_name": "Backed Assets" },
          { "symbol": "NVDAon", "price": 230.28, "issuer_name": "Ondo Assets" }
        ]
      }
    ]
  }
}
```

#### 3. Cryptocurrency Quotes — Base Token Prices

**Code** (`app/api/crypto-prices/route.ts`):
```typescript
const url = new URL("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest");
url.searchParams.set("id", ids);
url.searchParams.set("convert", "USD");
```

**Response** (truncated):
```json
{
  "data": {
    "5426": {
      "name": "Solana",
      "symbol": "SOL",
      "quote": {
        "USD": {
          "price": 119.57,
          "percent_change_24h": 1.53,
          "market_cap": 70287482433.59
        }
      }
    }
  },
  "status": { "credit_count": 1 }
}
```

#### 4. OHLCV Historical — Price Chart Data

**Code** (`amplify/functions/ohlcv-fetcher/handler.ts`):
```typescript
const url = new URL(`${BASE_URL}/v2/cryptocurrency/ohlcv/historical`);
url.searchParams.set("id", String(cryptoId));
url.searchParams.set("convert", "USD");
url.searchParams.set("time_start", timeStart);
url.searchParams.set("time_end", timeEnd);
url.searchParams.set("interval", interval);
```

**Response** (truncated):
```json
{
  "data": {
    "id": 5426,
    "symbol": "SOL",
    "quotes": [
      {
        "time_open": "2026-09-21T00:00:00.000Z",
        "quote": {
          "USD": {
            "open": 111.13,
            "high": 119.81,
            "low": 110.96,
            "close": 118.75,
            "volume": 6854063256.49
          }
        }
      }
    ]
  }
}
```

### How CoinMarketCap API Shaped Wayfind

CoinMarketCap's RWA and market-data APIs were central to Wayfind's asset discovery and risk intelligence layer.

* **RWA Discovery** — `/v5/real-world-assets/map` provides a paginated catalog of tokenized assets, allowing us to discover and track 534+ active tokenized equities from 4,686+ RWA records.
* **Metadata Enrichment** — `/v5/real-world-assets/info` provides company and asset metadata such as website, industry, founding date, employee count, and exchange information without requiring custom scraping.
* **Live Market Data** — `/v2/cryptocurrency/quotes/latest` provides price, market cap, volume, and percentage changes for both underlying crypto assets and tokenized assets.
* **Historical Data** — `/v2/cryptocurrency/ohlcv/historical` powers historical price and candlestick data used in portfolio analysis and exploration.

Working with the API also introduced several practical engineering constraints. RWA endpoints are separate from standard cryptocurrency endpoints, supply fields can be incomplete for some tokenized assets, and differences between CMC API versions required explicit response mapping. Rate limits also required us to batch requests and introduce delays when synchronizing large asset sets. These constraints shaped our caching, batching, and data-normalization approach.

## Getting Started

1. Install packages. This project requires Node.js >= 18.0.0.

```bash
npm install
```

2. Add `.env.local` file with required environment variables:

```bash
# CoinMarketCap Pro API
CMC_API_KEY=your_cmc_api_key

# OKX DEX Router
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase

# AI Provider (OpenAI-compatible)
OPENAI_API_KEY=your_openai_api_key

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

3. Deploy Amplify backend:

```bash
npx ampx sandbox
```

4. Start development server:

```bash
npm run dev
```

### For AI Agents

**Grok Bot:** Download a template from [wayfind.click](https://wayfind.click/) — Grok Bot will guide you through setup.

**Other agents (Claude Code, Cursor, OpenCode):**

1. Install the MCP server:

```bash
npm install -g @tamago-labs/wayfind-mcp
```

2. Get your API key from [wayfind.click](https://wayfind.click/) dashboard.

3. Configure for your agent:

```json
{
  "mcpServers": {
    "wayfind-solana": {
      "command": "npx",
      "args": ["-y", "@tamago-labs/wayfind-mcp"],
      "env": { "WAYFIND_API_KEY": "your_key_here" }
    }
  }
}
```

## Project Structure

```
app/
  dashboard/
    portfolio/      # Portfolio Overview
    explore/        # Explore Tokenized Stocks
    pre-ipo/        # Pre-IPO Markets
    strategies/     # Rule-Based Strategies
    new-chat/       # New Portfolio Review
    review/         # AI Risk Review Wizard
    chats/[id]/     # Chat Further (post-review discussion)
    token/[slug]/[crypto_id]/  # Token Detail
  api/
    crypto-prices/  # CMC proxy route
    swap-instruction/ # OKX DEX swap
components/
  dashboard/        # Dashboard-specific components
  landing/          # Landing page components
amplify/
  functions/
    price-tracker/  # Scheduled CMC price fetcher
    ohlcv-fetcher/  # OHLCV historical data fetcher
    risk-review/    # AI Risk Engine Lambda
    chat-further/   # Post-review chat Lambda
  data/             # Data models and schema
scripts/
  fetch-all.ts      # Fetch all stock RWAs from CMC
  rwa-filter.ts     # Filter active stocks by price
  rwa-info-final.ts # Fetch RWA metadata from CMC
lib/
  data/
    rwa-v1-list.json  # Generated token registry (534 tokens)
```

## AI Credits

Wayfind uses an AI credits system to power on-demand analysis. Each user can claim **1,000 free AI credits** to get started — no purchase required. Credits are consumed when running AI-powered operations: risk evaluations consume based on input/output token usage across the analysis pipeline, and each chat message in the multi-agent system consumes based on model token usage.

Wayfind is currently free for all users. As we scale, usage-based pricing will be introduced so you only pay for the AI analysis you actually use. All AI operations deduct credits at a fixed rate of **$0.01 per token** (input + output).

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend:** AWS Amplify Gen 2, AWS Lambda, DynamoDB
- **AI:** OpenAI Agents SDK, multi-agent architecture with session memory, Frontier AI (GPT-6 Astra)
- **Agent Infrastructure:** MCP Server (`@tamago-labs/wayfind-mcp`), Agent Skills (`wayfind-skills`) for Grok Bot, Claude Code, Cursor
- **Blockchain:** Solana Web3.js, OKX DEX Router, multi-chain wallet support
- **Data:** CoinMarketCap Pro (RWA + crypto endpoints), PreStocks API

## License

MIT
