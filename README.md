# Zivic

**Zivic** is an AI-powered risk engine for **tokenized equities on Solana** that transforms on-chain stock tokens into productive, analyzable assets. It evaluates portfolio risk across concentration, market volatility, and token liquidity dimensions, then delivers actionable rebalancing suggestions and yield opportunities through a multi-agent AI system. Trade execution happens directly on **Solana Mainnet** via the OKX DEX Router.

## Highlighted Features

- **Live on Solana Mainnet** — real on-chain transactions for acquiring tokenized stocks (xStocks, Ondo) and PreStocks (pre-IPO tokens) via OKX DEX Router
- **AI Risk Engine** — evaluates portfolios across three dimensions: concentration risk, market risk (equity volatility, sector concentration), and token/liquidity risk (issuer quality, trading volume), producing a 0-100 risk score
- **Multi-Agent AI System** — triage routing to specialized agents: Trade Specialist, Risk Evaluator, Rebalance Advisor, and Yield Strategist
- **Portfolio Tracking** — connects to your Solana wallet and reads on-chain holdings across tokenized stocks (xStocks by Backed Assets, Ondo Stocks) and PreStocks (pre-IPO equity tokens)
- **DeFi Yield Discovery** — shows available yield opportunities via Kamino lending and Byreal liquidity pools with real-time APY and APR data
- **CoinMarketCap Pro Market Analytics** — indexes all Solana tokenized stocks and enriches with CoinMarketCap Pro market data for direct asset evaluation and portfolio decisions
- **Frontier AI Research** — empowers AWS Lambda serverless functions to analyze all tokens, summarizing risk, valuation, and on-chain fundamentals at scale

## System Overview

The system comprises 3 main components designed for scalability and comprehensive tokenized equity analysis:

- **Next.js Frontend (App Router)** — The main interface where users access portfolio tracking, risk analysis, token exploration, pre-IPO discovery, side-by-side comparison, and AI chat. The dashboard reads on-chain wallet data, displays live market metrics from CoinMarketCap, and visualizes AI-generated risk reports and recommendations.
- **AWS Amplify Backend** — Handles data persistence, serverless compute, and scheduled data ingestion. DynamoDB stores price snapshots, pre-_stock valuations, risk evaluations, and user sessions. Lambda functions run scheduled trackers for market data, PreStock valuations, and AI-powered analysis agents.
- **AI Agent System** — Powered by the OpenAI Agents SDK with a multi-agent architecture. A Triage Agent routes user requests to specialized agents, each with distinct tools and context. Agents have access to real-time market data, on-chain balances, OKX DEX routing, and yield protocol data.

The architecture enables continuous data ingestion from multiple sources (CoinMarketCap Pro, PreStocks API, Kamino, Byreal), AI analysis on demand, and real-time portfolio tracking through a unified dashboard. Trade execution occurs on Solana Mainnet with user approval at every step.

## Frontend

The dashboard provides a comprehensive interface for tokenized equity analysis:

- **Portfolio** — Connect your Solana wallet to view holdings across tokenized stocks and PreStocks. See total portfolio value, 24h change, underlying sector exposure, and AI-generated risk scores. Run risk evaluations to get concentration analysis, rebalancing suggestions, and yield opportunities.

- **Explore** — Browse all tokenized stocks on Solana with real-time price, market cap, volume, and percentage changes from CoinMarketCap data. Filter by issuer (xStock/Ondo), sector, or metric.

- **Pre-IPO** — Discover pre-IPO tokens (PreStocks) with mark price, implied valuation, premium/discount, and 24h change. Each token includes company metadata with a built-in trade widget enables direct swaps via OKX DEX Router.

- **Compare** — Select any two tokens (tokenized or pre-IPO) for side-by-side comparison across price, market cap, volume, supply, yield (Kamino/Byreal), mark price, and premium.

- **Chat** — Multi-agent AI chat where you can ask about tokenized stocks, get personalized recommendations, find best trade routes, and execute swaps through conversational commands.

## Backend

Zivic's backend uses **AWS Amplify Gen 2** with serverless functions, DynamoDB tables, and scheduled data ingestion.

### Data Models

- **PriceSnapshot** — Stores CoinMarketCap market data per tokenized stock (price, market_cap, volume_24h, percent changes, supply). Updated hourly by scheduled tracker.
- **PreStock** — Tracks pre-IPO token valuations (markPrice, tokenPrice, markValuation, impliedValuation, supply). Updated every 6 hours from PreStocks API.
- **RiskEvaluation** — Persists AI-generated risk reports per wallet, including risk scores, rebalancing suggestions, and yield strategies.
- **AgentSession** — Stores chat conversation history and transaction records for the multi-agent AI chat system.

### Scheduled Trackers

- **Price Tracker** — Fetches market data from CoinMarketCap Pro for all configured tokenized stocks. Stores price, market cap, volume, and percentage changes. Runs every hour.
- **PreStock Tracker** — Pulls latest valuations from PreStocks API for pre-IPO tokens. Updates markPrice, tokenPrice, markValuation, impliedValuation, and supply. Runs every hour.

### Lambda Functions

- **Chat API** — Main entry point for the multi-agent AI chat system. Manages SSE streaming, agent routing, tool execution, and credit deduction.
- **Evaluate Risk** — Runs the 3-turn AI risk analysis pipeline (Risk Evaluator, Rebalance Advisor, Yield Strategist). Returns comprehensive portfolio risk reports with actionable recommendations.
- **Balance API** — Fetches on-chain SPL token balances for connected wallets.
- **OHLCV API** — Retrieves historical price data from CoinMarketCap for chart rendering.
- **OKX Swap** — Handles quote fetching and swap instruction building via OKX DEX Router.

## Data Sources

Zivic aggregates data from multiple sources to provide comprehensive tokenized equity coverage:

| Source | Data | Coverage |
|--------|------|----------|
| **CoinMarketCap Pro** | Price, market cap, volume, % changes, OHLCV, RWA endpoints | All tokenized stocks (xStocks, Ondo) |
| **PreStocks API** | Mark price, token price, valuations, supply | All pre-IPO tokens |
| **Google News RSS** | Latest financial and crypto news | Tokenized stock news |
| **Yahoo Finance RSS** | Market news and analysis | Broader market context |
| **Kamino** | Lending APY, borrow rates, utilization | 8 tokenized stock markets |
| **Byreal** | LP APR, TVL, trading volume | 12 tokenized stock pools |

We use CoinMarketCap's new **RWA endpoints** to fetch company information, enriching each token with metadata like sector, issuer, and exchange listing.

## AI Agents

Zivic uses a **multi-agent architecture** powered by the OpenAI Agents SDK. Agents communicate through a shared session memory, enabling context passing across analysis turns.

### Agent Architecture

- **Triage Agent** — Routes incoming user requests to the appropriate specialist agent based on intent detection.
- **Trade Specialist** — Executes token swaps via OKX DEX Router. Supports fetching quotes, building swap instructions, and sending transactions on Solana Mainnet. Handles both xStocks/Ondo tokens and PreStocks.
- **Risk Evaluator** — Analyzes portfolio across concentration, market risk, and token/liquidity dimensions. Produces structured risk scores (0-100) with institutional-grade terminology.
- **Rebalance Advisor** — Based on risk analysis context, suggests specific rebalancing actions (reduce, add, diversify, hedge) with target allocations.
- **Yield Strategist** — Cross-references holdings with available Kamino lending and Byreal liquidity pool opportunities. Recommends earn or borrow-to-accumulate strategies with specific APY/APR data.

### Agent Tools

- **get_user_balance** — Fetches SOL + SPL token balances via Solana RPC
- **prepare_trade** — Gets OKX DEX quote and builds swap transaction
- **fetch_cmc_data** — Retrieves CoinMarketCap metadata, market data, and OHLCV
- **fetch_pre_stock** — Queries PreStock database for latest valuations

## On-Chain Transactions

Zivic enables real on-chain transactions on Solana Mainnet. The AI agent acquires tokens through the OKX DEX Router with user approval at every step.

### Example: Acquiring SpaceX xStock (SPCXx)

The AI agent routed through OKX DEX to acquire SpaceX tokenized stock on Solana Mainnet:

https://solscan.io/tx/C66pxEPJgdKkGWtqDpUBLJZxJX3hYa5XiZx4uXa4qXxcbtVof81P3pbFrVzEPBd5ymJKPQgHydkxPj1QqivqHuH

### Example: Acquiring Anduril PreStocks (ANDURIL)

The AI agent acquired Anduril PreStocks (pre-IPO token) via OKX DEX Router on Solana Mainnet:

https://solscan.io/tx/4gVjrdLeB7MmnWSvPM3a43GdVMdma3LWan3J4Sccf73ADnHu8GqbGn4G8GbTzWhE9KGhdFhVtDGie82V4EdAAfoH

## Getting Started

1. Install packages. This project is tested with Node.js >= 18.0.0.

```bash
npm install
# or
pnpm install
```

2. Add `.env.local` file with required environment variables:

```bash
# CoinMarketCap Pro API
CMC_API_KEY=your_cmc_api_key

# OKX DEX Router
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase

# AI Provider
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
# or
pnpm dev
```

## AI Credits

Zivic uses an AI credits system to power on-demand analysis. Each wallet can claim **1,000 free AI credits** to get started — no purchase required. Credits are consumed when running AI-powered operations: risk evaluations consume based on input/output token usage across the 3-turn analysis pipeline, and each chat message in the multi-agent system consumes based on model token usage.

Zivic is currently free for all users. As we scale, usage-based pricing will be introduced so you only pay for the AI analysis you actually use. All AI operations deduct credits at a fixed rate of **$0.05 per 1,000 tokens** (input + output).

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend:** AWS Amplify Gen 2, AWS Lambda, DynamoDB
- **AI:** OpenAI Agents SDK, multi-agent architecture with session memory
- **Blockchain:** Solana Web3.js, OKX DEX Router, CoinGecko/CoinMarketCap
- **Data:** CoinMarketCap Pro, PreStocks API, Kamino, ByReal

## License

MIT
