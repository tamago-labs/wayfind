// Wayfind API Test 5: Pre-IPO Markets
// Tests GET /pre-ipo — returns PreStocks markets with mark price, token price,
// valuation, and supply from the PreStock database
// Usage: npx tsx scripts/test-api/5-pre-ipo.ts

import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("🚀 Pre-IPO Tests");

  await test("GET /pre-ipo returns markets", async () => {
    const { status, body } = await request("/pre-ipo");
    assertEquals(status, 200);
    assertDefined(body.data);
    assert(Array.isArray(body.data));
  });

  await test("Pre-IPO market has expected fields", async () => {
    const { body } = await request("/pre-ipo");
    if (body.data.length > 0) {
      const market = body.data[0];
      assertDefined(market.symbol, "Missing symbol");
      assertDefined(market.tokenPrice, "Missing tokenPrice");
      assertDefined(market.markPrice, "Missing markPrice");
    }
  });
}

run();
