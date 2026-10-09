// Wayfind API Test 1: Authentication
// Tests API key validation (missing, invalid, valid)
// Usage: npx tsx scripts/test-api/1-auth.ts

import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("🔐 Auth Tests");

  await test("No API key returns 401", async () => {
    const { status } = await request("/tokens", "");
    assertEquals(status, 401);
  });

  await test("Invalid API key returns 401", async () => {
    const { status } = await request("/tokens", "invalid-key-12345");
    assertEquals(status, 401);
  });

  await test("Valid API key returns 200", async () => {
    const { status } = await request("/tokens");
    assertEquals(status, 200);
  });
}

run();
