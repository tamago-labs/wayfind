// CoinGecko Script 1: Coin markets by coingecko_id
// Endpoint: GET /coins/markets
// Returns price, volume, % changes, market cap, supply
// Usage: npx tsx scripts/coingecko/1-coins-markets.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = "https://api.coingecko.com/api/v3";

const COINGECKO_IDS: Record<string, string> = {
  CRCLX: "circle-xstock",
  SPCXx: "spacex-xstocks",
  MSTRX: "microstrategy-xstock",
  NVDAX: "nvidia-xstock",
  TSLAX: "tesla-xstock",
  GOOGLX: "alphabet-xstock",
  COINX: "coinbase-xstock",
  INTCX: "intel-xstock",
  AAPLX: "apple-xstock",
  AMZNX: "amazon-xstock",
};

async function fetchMarkets(ids: string[]) {
  const url = new URL(`${BASE_URL}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("price_change_percentage", "1h,24h,7d,30d");
  url.searchParams.set("per_page", "250");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("=== CoinGecko Coins Markets ===\n");

  const ids = Object.values(COINGECKO_IDS);

  try {
    const markets = await fetchMarkets(ids);

    for (const m of markets) {
      console.log(`${m.symbol.toUpperCase()} — ${m.name}`);
      console.log(`  ID: ${m.id}`);
      console.log(`  Price: $${m.current_price?.toLocaleString() ?? "N/A"}`);
      console.log(`  Market Cap: $${m.market_cap?.toLocaleString() ?? "N/A"}`);
      console.log(`  Volume 24h: $${m.total_volume?.toLocaleString() ?? "N/A"}`);
      console.log(`  % 1h: ${m.price_change_percentage_1h_in_currency ?? "N/A"}%`);
      console.log(`  % 24h: ${m.price_change_percentage_24h_in_currency ?? "N/A"}%`);
      console.log(`  % 7d: ${m.price_change_percentage_7d_in_currency ?? "N/A"}%`);
      console.log(`  % 30d: ${m.price_change_percentage_30d_in_currency ?? "N/A"}%`);
      console.log(`  Circulating Supply: ${m.circulating_supply?.toLocaleString() ?? "N/A"}`);
      console.log(`  Total Supply: ${m.total_supply?.toLocaleString() ?? "N/A"}`);
      console.log(`  Last Updated: ${m.last_updated}`);
      console.log("");
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

main().catch(console.error);
