// Usage: npx tsx scripts/open-ai/3-agent-with-tools.ts

import { Agent, run, tool } from '@openai/agents'
import { z } from 'zod'
import { getClient, PROVIDER_MODEL } from './provider'

function findKey(map: Record<string, unknown>, input: string): string | undefined {
  const lower = input.toLowerCase()
  return Object.keys(map).find((k) => k.toLowerCase() === lower)
}

const getTokenPrice = tool({
  name: 'get_token_price',
  description: 'Get the current price of a tokenized stock on Solana.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol (e.g., "NVDAX", "TSLAX")'),
  }),
  async execute({ symbol }) {
    const prices: Record<string, number> = {
      'NVDAX': 245.50,
      'TSLAX': 178.30,
      'AAPLX': 198.75,
      'MSFTX': 420.10,
    }
    const key = findKey(prices, symbol)
    const price = key ? prices[key] : undefined
    return price != null ? `${symbol}: $${price} USDC` : `Price for ${symbol} not found.`
  },
})

const getMarketCap = tool({
  name: 'get_market_cap',
  description: 'Get the market cap of a tokenized stock.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol'),
  }),
  async execute({ symbol }) {
    const caps: Record<string, string> = {
      'NVDAX': '$598B',
      'TSLAX': '$568B',
      'AAPLX': '$3.1T',
      'MSFTX': '$3.2T',
    }
    const key = findKey(caps, symbol)
    return key ? `${symbol} market cap: ${caps[key]}` : `Market cap for ${symbol} not found.`
  },
})

const getRiskScore = tool({
  name: 'get_risk_score',
  description: 'Get the risk score (1-10) of a tokenized stock.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol'),
  }),
  async execute({ symbol }) {
    const scores: Record<string, number> = {
      'NVDAX': 7,
      'TSLAX': 8,
      'AAPLX': 3,
      'MSFTX': 2,
    }
    const key = findKey(scores, symbol)
    const score = key ? scores[key] : undefined
    return score != null ? `${symbol} risk score: ${score}/10` : `Risk data for ${symbol} not found.`
  },
})

async function main() {
  getClient()

  const agent = new Agent({
    name: 'Zivic Agent',
    instructions: `
      You are Zivic, an AI agent for tokenized stocks and pre-IPO on Solana.
      Use your tools to help users research tokens, check prices, market caps, and risk scores.
      Always verify data using tools before responding.
    `,
    model: PROVIDER_MODEL,
    tools: [getTokenPrice, getMarketCap, getRiskScore],
  })

  console.log('--- Test 1: Token price ---')
  const r1 = await run(agent, 'What is the current price of NVDAX?')
  console.log(r1.finalOutput)

  console.log('\n--- Test 2: Market cap ---')
  const r2 = await run(agent, 'What is the market cap of AAPLX?')
  console.log(r2.finalOutput)

  console.log('\n--- Test 3: Risk score ---')
  const r3 = await run(agent, 'How risky is TSLAX?')
  console.log(r3.finalOutput)
}

main().catch(console.error)
