import { NextRequest, NextResponse } from "next/server";
import getConfig from "next/config";

const { serverRuntimeConfig } = getConfig();

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const coingeckoId = request.nextUrl.searchParams.get("coingecko_id");
  const days = request.nextUrl.searchParams.get("days") || "90";

  if (!coingeckoId) {
    return NextResponse.json({ error: "coingecko_id required" }, { status: 400 });
  }

  const cacheKey = `${coingeckoId}-${days}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const url = new URL(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("days", days);

    const apiKey = serverRuntimeConfig.COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || "";
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
      return NextResponse.json({ error: `CoinGecko HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const prices = (json.prices ?? []).map(([timestamp, price]: [number, number]) => ({
      time: Math.floor(timestamp / 1000),
      price,
    }));

    const result = { data: prices };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cg-price-history] error:", err);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
