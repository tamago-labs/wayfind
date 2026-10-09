import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("🪙 Token Tests");

  await test("GET /tokens returns token list", async () => {
    const { status, body } = await request("/tokens");
    assertEquals(status, 200);
    assertDefined(body.data);
    assert(Array.isArray(body.data), "Data is not an array");
    assert(body.data.length > 0, "No tokens returned");
  });

  await test("Token has expected fields", async () => {
    const { body } = await request("/tokens");
    const token = body.data[0];
    assertDefined(token.token_symbol, "Missing token_symbol");
    assertDefined(token.symbol, "Missing symbol");
    assertDefined(token.price, "Missing price");
    assertDefined(token.name, "Missing name");
    assertDefined(token.addresses, "Missing addresses");
  });

  await test("GET /tokens/TSLA returns TSLA variants", async () => {
    const { status, body } = await request("/tokens/TSLA");
    assertEquals(status, 200);
    assertDefined(body.data);
    assert(body.data.length > 0, "No TSLA tokens found");
    body.data.forEach((t: any) => {
      assertEquals(t.symbol, "TSLA");
    });
  });

  await test("TSLA tokens include Solana addresses", async () => {
    const { body } = await request("/tokens/TSLA");
    const withSolana = body.data.filter((t: any) => t.addresses?.solana);
    assert(withSolana.length > 0, "No TSLA tokens with Solana address");
  });

  await test("Unknown ticker returns empty array", async () => {
    const { status, body } = await request("/tokens/UNKNOWNTICKER");
    assertEquals(status, 200);
    assertEquals(body.data.length, 0);
  });
}
