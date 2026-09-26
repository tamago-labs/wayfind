// Usage: npx tsx scripts/open-ai/1-agent-basic.ts

import { Agent, run } from '@openai/agents'
import { getClient, PROVIDER_MODEL } from './provider'

async function main() {
  getClient()

  const agent = new Agent({
    name: 'Zivic Agent',
    instructions: `
      You are Zivic, an AI agent for tokenized stocks and pre-IPO on Solana.
      You help users find, rank, and explain xStocks based on their goals and risk appetite.
      Be concise and professional.
    `,
    model: PROVIDER_MODEL,
  })

  const result = await run(agent, 'What can you help me with?')
  console.log('\n--- Result ---')
  console.log(result.finalOutput)
}

main().catch(console.error)
