# Wayfind

**AI Risk Engine for Tokenized Equities on Solana & Across Web3**

## Product Overview

Wayfind is an AI risk intelligence platform that helps investors understand the risk of what they own — and find clearer paths forward.

Tokenized equities combine crypto-native infrastructure with exposure to real companies. Investors need to consider company fundamentals, market conditions, portfolio concentration, token liquidity, issuer risk, onchain factors, and their own risk tolerance. Wayfind brings these signals together into one personalized risk view.

The platform has three layers:

* **Intelligence** — An AI Risk Engine analyzes holdings across fundamentals, market exposure, concentration, liquidity, issuer, and onchain factors.
* **Review** — An AI Portfolio Review turns those signals into a personalized risk score, factor breakdown, and explanation of the risks that matter most.
* **Action** — Rule-based strategies surface concentration alerts, risk-matching opportunities, and pre-IPO exposure, with token swapping available through OKX DEX Router.

## Background

Tokenized equities are becoming a growing part of the real-world asset market. CoinGecko reported approximately $0.5B in tokenized equity market capitalization by Q1 2026, alongside $15.1B in spot trading volume during the quarter.

As the market evolves beyond simply putting stocks onchain, holders need better ways to understand, manage, and use these assets.

### The Problem

**Crypto habits meet real-world assets.**

Crypto markets have trained investors to make decisions around price, liquidity, and narrative. But a tokenized stock represents exposure to a real company — with revenue, earnings, valuation, business fundamentals, and traditional market dynamics behind it.

The risk is therefore more than token price volatility.

Wayfind looks beyond what you hold. Connect a wallet, answer a short set of adaptive questions, and get a personalized view of your portfolio risk. Understand the factors driving your score, uncover risks that may be easy to miss, and explore clearer paths to rebalance or put your assets to work.

## Features

* **AI Portfolio Review** — A two-turn risk assessment combining an adaptive questionnaire with portfolio analysis to produce a personalized risk score, factor breakdown, and hidden-risk analysis.
* **Explainable Risk Engine** — Evaluates concentration, market exposure, volatility, liquidity, issuer, fundamentals, onchain factors, and other portfolio-specific risks.
* **AI Specialists** — Continue the conversation after the review with AI specialists covering market research, news intelligence, and pre-IPO markets, powered by Frontier AI (GPT-6 Astra).
* **Multi-chain Supported** — Track tokenized assets across Solana, Ethereum, BNB Chain, Arbitrum, and X Layer.
* **Real-World Asset Data** — Explore tokenized equities, commodities, treasuries, funds, and issuers using CoinMarketCap RWA data.
* **Pre-IPO Markets** — Explore and trade PreStocks markets on Solana with mark price, token price, implied valuation, and related market data.
* **Actionable Strategies** — Rule-based signals for concentration risk, risk matching, and pre-IPO exposure help turn portfolio analysis into practical next steps.
* **Token Swapping** — Swap supported assets into tokenized stock tokens through OKX DEX Router.

## System Overview

The system comprises three main components designed for scalable tokenized equity analysis:

- **Next.js Frontend (App Router)** — The main interface where users access portfolio tracking, risk analysis, token exploration, pre-IPO discovery, and AI chat. The dashboard reads on-chain wallet data, displays live market metrics from CoinMarketCap, and visualizes AI-generated risk reports.
- **AWS Amplify Backend** — Handles data persistence, serverless compute, and scheduled data ingestion. DynamoDB stores price snapshots, pre-stock valuations, risk evaluations, user profiles, and chat sessions. Lambda functions run scheduled trackers for market data and AI-powered analysis agents.
- **AI Agent System** — Powered by the OpenAI Agents SDK with a multi-agent architecture. A Triage Agent routes user requests to specialized agents, each with distinct tools and context. Agents have access to real-time market data, on-chain balances, and OKX DEX routing.

The architecture enables continuous data ingestion from CoinMarketCap Pro and PreStocks API, AI analysis on demand, and real-time portfolio tracking through a unified dashboard.

## User Flow

### 1. Build Your Portfolio

* Connect a wallet to automatically detect tokenized equity holdings, or
* Simulate a portfolio without connecting a wallet

### 2. Personalize Your Review

* Start a portfolio risk review
* Answer 3–5 adaptive questions generated around your holdings and risk profile

### 3. Understand Your Risk

* The AI Risk Engine evaluates fundamentals, market exposure, concentration, liquidity, issuer risk, and onchain factors
* Get a personalized **0–100 risk score** with dimensional breakdowns and hidden-risk insights

### 4. Go Deeper

* Continue the conversation with AI specialists after the review
* Explore market research, news intelligence, and pre-IPO data through specialist handoffs

### 5. Find Your Next Move

* Explore rule-based strategy insights based on your portfolio and risk profile
* Surface concentration alerts, risk-matching opportunities, and pre-IPO exposure

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
- **Blockchain:** Solana Web3.js, OKX DEX Router, multi-chain wallet support
- **Data:** CoinMarketCap Pro (RWA + crypto endpoints), PreStocks API

## License

MIT
