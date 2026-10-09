// Wayfind API Test 4: Market Overview
// Tests GET /market-overview — returns total market cap, volume, token count,
// gainers, losers, and trending tokens from PriceSnapshot database
// Usage: npx tsx scripts/test-api/4-market.ts

import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("📈 Market Overview Tests");

  await test("GET /market-overview returns data", async () => {
    const { status, body } = await request("/market-overview");
    assertEquals(status, 200);
    assertDefined(body.data);
  });

  await test("Market overview has expected fields", async () => {
    const { body } = await request("/market-overview");
    assertDefined(body.data.totalMarketCap, "Missing totalMarketCap");
    assertDefined(body.data.totalVolume24h, "Missing totalVolume24h");
    assertDefined(body.data.tokenCount, "Missing tokenCount");
    assert(typeof body.data.totalMarketCap === "number");
    assert(typeof body.data.tokenCount === "number");
  });

  await test("Market overview has gainers/losers/trending arrays", async () => {
    const { body } = await request("/market-overview");
    assert(Array.isArray(body.data.gainers), "gainers is not an array");
    assert(Array.isArray(body.data.losers), "losers is not an array");
    assert(Array.isArray(body.data.trending), "trending is not an array");
  });
}

run();
