// Byreal Pool Checker
// Reads pre-ipo-list.json + rwa-v1-list.json, checks Byreal for LP pools
// Usage: npx tsx scripts/kamino/2-byreal-pool-check.ts

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BYREAL_API = "https://api2.byreal.io";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface AssetMint {
  symbol: string;
  name: string;
  mint: string;
  source: string;
}

interface PoolMatch {
  symbol: string;
  name: string;
  mint: string;
  source: string;
  poolAddress: string;
  feeTier: number;
  tvl: number;
  volumeUsd24h: number;
  feeUsd24h: number;
  apr24h: number | null;
  price: number | null;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`HTTP ${res.status} for ${url}: ${await res.text()}`);
    return null;
  }
  return res.json();
}

async function getAllPools() {
  const allPools: any[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const data = await fetchJson(
      `${BYREAL_API}/byreal/api/dex/v2/pools/info/list?pageSize=${pageSize}&page=${page}&sortField=apr24h&sortType=desc`
    );
    const list = data?.result?.data?.records ?? data?.result?.data?.list ?? data?.data?.list ?? data?.list ?? [];
    if (list.length === 0) break;
    allPools.push(...list);
    if (list.length < pageSize) break;
    page++;
    await sleep(200);
  }

  return allPools;
}

async function getPoolDetails(poolAddress: string) {
  const data = await fetchJson(
    `${BYREAL_API}/byreal/api/dex/v2/pools/details?poolAddress=${poolAddress}`
  );
  return data?.data ?? null;
}

async function main() {
  const preIpo = JSON.parse(readFileSync(join(process.cwd(), "lib", "data", "pre-ipo-list.json"), "utf-8"));
  const rwaList = JSON.parse(readFileSync(join(process.cwd(), "lib", "data", "rwa-v1-list.json"), "utf-8"));

  const mints: AssetMint[] = [];
  for (const a of preIpo.assets) {
    mints.push({ symbol: a.symbol, name: a.name, mint: a.mint, source: "pre-ipo" });
  }
  for (const a of rwaList.assets) {
    for (const t of a.tokens ?? []) {
      mints.push({ symbol: t.symbol, name: t.name, mint: t.mint, source: "rwa" });
    }
  }

  const uniqueMints = [...new Map(mints.map((m) => [m.mint, m])).values()];
  const mintSet = new Set(uniqueMints.map((m) => m.mint));
  console.log(`Loaded ${uniqueMints.length} unique token mints\n`);

  console.log("Fetching Byreal pools...");
  const pools = await getAllPools();
  console.log(`  Found ${pools.length} pools\n`);

  const matches: PoolMatch[] = [];

  for (const pool of pools) {
    const mintA = pool.mintA?.mintInfo?.address ?? pool.mintA ?? "";
    const mintB = pool.mintB?.mintInfo?.address ?? pool.mintB ?? "";

    let matchedAsset: AssetMint | null = null;
    if (mintSet.has(mintA)) {
      matchedAsset = uniqueMints.find((m) => m.mint === mintA)!;
    } else if (mintSet.has(mintB)) {
      matchedAsset = uniqueMints.find((m) => m.mint === mintB)!;
    }

    if (matchedAsset) {
      const details = await getPoolDetails(pool.poolAddress);
      matches.push({
        symbol: matchedAsset.symbol,
        name: matchedAsset.name,
        mint: matchedAsset.mint,
        source: matchedAsset.source,
        poolAddress: pool.poolAddress,
        feeTier: pool.feeTier ?? details?.feeTier ?? 0,
        tvl: parseFloat(pool.tvl ?? details?.tvl ?? "0"),
        volumeUsd24h: parseFloat(pool.volumeUsd24h ?? details?.volumeUsd24h ?? "0"),
        feeUsd24h: parseFloat(pool.feeUsd24h ?? details?.feeUsd24h ?? "0"),
        apr24h: pool.feeApr24h != null ? parseFloat(pool.feeApr24h) : null,
        price: pool.price ?? details?.price ?? null,
      });
      await sleep(100);
    }
  }

  console.log(`Found ${matches.length} matching pools\n`);
  for (const m of matches) {
    const apr = m.apr24h != null ? `${(m.apr24h * 100).toFixed(2)}%` : "-";
    const tvl = m.tvl > 0 ? `$${m.tvl.toLocaleString()}` : "-";
    console.log(`  ${m.symbol.padEnd(12)} apr24h=${apr.padEnd(10)} tvl=${tvl.padEnd(15)} pool=${m.poolAddress}`);
  }

  const outputPath = join(process.cwd(), "lib", "data", "byreal-pool-results.json");
  writeFileSync(
    outputPath,
    JSON.stringify({ fetched_at: new Date().toISOString(), match_count: matches.length, matches }, null, 2)
  );
  console.log(`\nSaved to: ${outputPath}`);
}

main().catch(console.error);

export {};
