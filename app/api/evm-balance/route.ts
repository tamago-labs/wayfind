import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SUPPORTED_CHAINS } from '@/lib/chains';

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_MS = 15_000;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  const chainId = Number(request.nextUrl.searchParams.get('chainId') ?? '1');

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!chain) {
    return NextResponse.json({ error: 'unsupported chain' }, { status: 400 });
  }

  const cacheKey = `${chainId}:${address}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const balance = await provider.getBalance(address);
    const nativeBalance = ethers.formatEther(balance);

    const response = {
      native: nativeBalance,
      chainId,
      chainName: chain.name,
      tokens: {},
    };

    cache.set(cacheKey, { data: response, ts: Date.now() });
    return NextResponse.json(response);
  } catch (err) {
    console.error('[evm-balance] error:', err);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
