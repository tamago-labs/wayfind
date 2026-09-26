// Usage: npx tsx scripts/open-ai/2-agent-streaming.ts

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

  const result = await run(agent, 'Give me a brief overview of tokenized stocks on Solana.', { stream: true })

  for await (const event of result) {
    if (event.type === 'raw_model_stream_event') {
      const data = event.data as any;
      if (data.type === 'output_text_delta') {
        process.stdout.write(data.delta)
      }
    }
  }

  console.log('\n\n--- Done ---')
}

main().catch(console.error)
