// Debug: Check Byreal pool mint matching
// Usage: npx tsx scripts/kamino/debug-byreal.ts

import { readFileSync } from "fs";
import { join } from "path";

const BYREAL_API = "https://api2.byreal.io";

async function main() {
  const preIpo = JSON.parse(readFileSync(join(process.cwd(), "lib", "data", "pre-ipo-list.json"), "utf-8"));
  const rwaList = JSON.parse(readFileSync(join(process.cwd(), "lib", "data", "rwa-v1-list.json"), "utf-8"));

  const mintSet = new Set<string>();
  for (const a of preIpo.assets) mintSet.add(a.mint);
  for (const a of rwaList.assets) {
    for (const t of a.tokens ?? []) mintSet.add(t.mint);
  }
  console.log(`Total mints in data: ${mintSet.size}`);

  const res = await fetch(
    `${BYREAL_API}/byreal/api/dex/v2/pools/info/list?pageSize=100&page=1&sortField=apr24h&sortType=desc`
  );
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response keys: ${Object.keys(data ?? {})}`);
  console.log(`result keys: ${Object.keys(data?.result ?? {})}`);
  console.log(`result.data keys: ${Object.keys(data?.result?.data ?? {})}`);
  console.log(`First pool sample: ${JSON.stringify(data?.result?.data?.list?.[0] ?? "none").substring(0, 500)}`);
  const list = data?.result?.data?.list ?? data?.data?.list ?? data?.list ?? [];
  console.log(`Pools from API: ${list.length}`);

  const sample = list.slice(0, 5);
  for (const p of sample) {
    const mintA = p.mintA?.mintInfo?.address ?? p.mintA ?? "";
    const mintB = p.mintB?.mintInfo?.address ?? p.mintB ?? "";
    const matchA = mintSet.has(mintA);
    const matchB = mintSet.has(mintB);
    console.log(`  ${p.poolAddress.slice(0, 8)}... mintA=${mintA.slice(0, 8)}... mintB=${mintB.slice(0, 8)}... matchA=${matchA} matchB=${matchB}`);
  }

  const crclxMint = "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1";
  console.log(`\nCRCLx mint in data: ${mintSet.has(crclxMint)}`);
  const found = list.find((p: any) => p.mintA?.mintInfo?.address === crclxMint || p.mintB?.mintInfo?.address === crclxMint);
  console.log(`CRCLx pool found: ${found ? found.poolAddress : "NOT FOUND"}`);

  if (found) {
    console.log(`  mintA: ${JSON.stringify(found.mintA?.mintInfo?.address)}`);
    console.log(`  mintB: ${JSON.stringify(found.mintB?.mintInfo?.address)}`);
  }
}

main().catch(console.error);
