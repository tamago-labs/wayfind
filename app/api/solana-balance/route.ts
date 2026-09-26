import { NextRequest, NextResponse } from 'next/server';

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet.solana.com';

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_MS = 15_000;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  const cached = cache.get(address);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const [solRes, splRes, spl2022Res] = await Promise.all([
      fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
      }).then((r) => r.json()),
      fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' },
          ],
        }),
      }).then((r) => r.json()),
      fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' },
            { encoding: 'jsonParsed' },
          ],
        }),
      }).then((r) => r.json()),
    ]);

    const lamports = solRes?.result?.value ?? 0;
    const solBalance = lamports / 1e9;

    const splBalances: Record<string, number> = {};
    const splAccounts = splRes?.result?.value ?? [];
    const spl2022Accounts = spl2022Res?.result?.value ?? [];

    for (const account of [...splAccounts, ...spl2022Accounts]) {
      const info = account.account?.data?.parsed?.info;
      if (info?.mint && info?.tokenAmount?.uiAmount != null) {
        splBalances[info.mint] = info.tokenAmount.uiAmount;
      }
    }

    const response = { sol: solBalance, spl: splBalances };
    cache.set(address, { data: response, ts: Date.now() });
    return NextResponse.json(response);
  } catch (err) {
    console.error('[solana-balance] error:', err);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
