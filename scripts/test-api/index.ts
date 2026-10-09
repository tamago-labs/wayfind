import { getResults } from "./config";
import * as authTests from "./1-auth";
import * as tokenTests from "./2-tokens";
import * as riskProfileTests from "./3-risk-profile";
import * as marketTests from "./4-market";
import * as preIpoTests from "./5-pre-ipo";

async function main() {
  console.log("🧪 Wayfind API Test Suite");
  console.log("=========================\n");

  await authTests.run();
  await tokenTests.run();
  await riskProfileTests.run();
  await marketTests.run();
  await preIpoTests.run();

  const results = getResults();
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n=========================");
  console.log(`📊 Results: ${passed}/${total} passed, ${failed} failed (${duration}ms)`);

  if (failed > 0) {
    console.log("\n❌ Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
  }
}

main();
