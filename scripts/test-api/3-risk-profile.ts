// Wayfind API Test 3: Risk Profile
// Tests GET /risk-profile — returns overallScore, overallLabel, answers
// from the user's default saved review
// Usage: npx tsx scripts/test-api/3-risk-profile.ts

import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("📊 Risk Profile Tests");

  await test("GET /risk-profile returns profile", async () => {
    const { status, body } = await request("/risk-profile");
    assertEquals(status, 200);
    assertDefined(body.data);
  });

  await test("Risk profile has expected fields", async () => {
    const { body } = await request("/risk-profile");
    assertDefined(body.data.overallScore, "Missing overallScore");
    assertDefined(body.data.overallLabel, "Missing overallLabel");
    assertDefined(body.data.answers, "Missing answers");
    assert(typeof body.data.overallScore === "number", "overallScore is not a number");
    assert(typeof body.data.overallLabel === "string", "overallLabel is not a string");
  });
}

run();
