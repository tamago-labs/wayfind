# Wayfind

**Find Your Way Through Tokenized Equities**

Wayfind is an AI risk intelligence platform for tokenized equities on Solana. It helps investors understand the risk of what they own, then find clearer paths forward — whether that means reducing concentration, rebalancing, or putting eligible assets to work.

## Product Overview

Wayfind solves a new problem created by tokenized equities: investors hold assets they don't fully understand across company risk, market risk, onchain risk, and their own risk tolerance.

### The Wayfind Loop

```
Build Portfolio → Understand Investor → Analyze Risk → Find Paths → Act → Monitor
```

### Three Layers

**Intelligence** — AI Risk Engine that analyzes holdings across company fundamentals, market exposure, concentration, liquidity, issuer, and onchain factors.

**Experience** — AI Portfolio Review that delivers a personalized risk score with explainable breakdowns and actionable recommendations.

**Action** — Personalized strategies to reduce risk, rebalance, or put eligible assets to work through integrated partners like OKX DEX Router.

## User Flow

### 1. Build Your Portfolio
- Connect wallet to auto-detect tokenized equity holdings, or
- Simulate a portfolio with xStocks, Ondo Stocks, PreStocks without connecting

### 2. Understand the Investor
- Short adaptive AI questionnaire (3-5 questions + follow-ups)
- Investment goals, time horizon, risk tolerance, yield vs growth preference, DeFi experience

### 3. Get Your Wayfind Risk Profile
- Combines Investor Profile + Portfolio + Asset Risk + Market Conditions
- Produces a Portfolio Risk Score with dimensional breakdown:
  - Market Risk
  - Concentration Risk
  - Liquidity Risk
  - Issuer Risk
  - DeFi / Collateral Risk

### 4. Choose Your Path
- **Reduce Risk** — Lower concentration, improve diversification
- **Rebalance** — Preview new allocation with estimated trading impact
- **Put Assets to Work** — Explore eligible lending/DeFi opportunities
- **Stay the Course** — No action recommended if portfolio fits profile

### 5. Execute & Monitor
- User approves actions, never automated
- Every recommendation includes "Why?" explainability
- Continuous monitoring as portfolio and risk change

## Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS, Framer Motion
- **Backend:** AWS Amplify Gen 2 (AppSync, DynamoDB, Lambda)
- **AI:** OpenAI Agents SDK with multi-agent architecture
- **Blockchain:** Solana Mainnet, OKX DEX Router
- **Data:** CoinMarketCap Pro, Jupiter

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
app/
  dashboard/
    portfolio/     # Portfolio Overview
    explore/       # Explore Tokenized Stocks
    pre-ipo/       # Pre-IPO Markets
    strategies/    # Strategies
    new-review/    # New Portfolio Review
components/
  dashboard/       # Dashboard-specific components
  landing/         # Landing page components
amplify/
  functions/       # Serverless functions
  data/            # Data models and schema
```

## Market Context

Tokenized equities are growing rapidly. CoinGecko reported ~$0.5B market cap by Q1 2026 with $15.1B spot volume in that quarter. The market is shifting from "put stocks onchain" to "what can holders do with these assets" — lending, collateral, liquidity, and portfolio construction.

Wayfind fits this activation phase by helping investors understand risk, then safely make tokenized assets productive.

## License

MIT
