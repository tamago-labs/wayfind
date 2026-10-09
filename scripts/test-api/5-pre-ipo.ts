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
