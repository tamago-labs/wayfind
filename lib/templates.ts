export const templates = [
  {
    id: 1,
    title: 'Solana Tokenized Stocks',
    description: 'Gives your bot the market context, risk awareness, and OKX DEX trading rails to manage a tokenized stock portfolio on Solana. One stock like Tesla can have multiple onchain representations — TSLAx, TSLAon, rTSLA — each with different prices and issuers.',
    image: '/template-solana-tokenized-stocks.png',
    creator: 'Wayfind',
    publishedAt: '2026-9-17',
    chains: ['Solana'],
    tags: ['xStocks', 'Ondo Stocks', 'Trading'],
    featured: false,
    link: 'https://x.ai/bot/EpQzEq9pQvX_utfgsxzbj',
    features: [
      'Resolves onchain token representations for equities like TSLA',
      'Tracks prices, liquidity, and issuer data across Solana',
      'Executes swaps via OKX DEX Router',
      'MCP server reads wallet balances and transaction history',
    ],
  },
  {
    id: 2,
    title: 'Circle USDC Payments',
    description: 'Integrated with Circle App Kits for payment and liquidity workflows across blockchains with one unified balance. Send and receive USDC across 10+ chains, swap tokens, earn yield, and borrow — all seamlessly inside your bot.',
    image: '/template-circle-usdc.png',
    creator: 'Wayfind',
    publishedAt: '2026-9-17',
    chains: ['Arc', 'Ethereum', 'Solana', 'Base', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Sonic', 'Unichain', 'World', 'Sei', 'HyperEVM'],
    tags: ['USDC', 'EURC', 'DeFi'],
    featured: false,
    link: 'https://x.ai/bot/IX2bDYMLKqQhe1hYFnXdi',
    features: [
      'One unified balance across 10+ chains',
      'Send and receive USDC and EURC',
      'Swap tokens via Circle Swap Kit',
      'Earn yield through Morpho and other vaults'
    ],
  },
];
