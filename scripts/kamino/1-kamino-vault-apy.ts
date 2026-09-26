// Kamino APY Checker
// Reads pre-ipo-list.json + rwa-v1-list.json, checks Kamino for vault/lending/PT/LST yield
// Usage: npx tsx scripts/kamino/1-kamino-vault-apy.ts

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
config({ path: ".env.local" });

const KAMINO_API = "https://api.kamino.finance";
const XSTOCKS_MARKET = "5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface AssetMint {
  symbol: string;
  name: string;
  mint: string;
  source: string;
}

interface MarketInfo {
  supplyApy: number | null;
  borrowApy: number | null;
  totalSupply: string;
  totalBorrow: string;
}

interface ApyResult {
  symbol: string;
  name: string;
  mint: string;
  source: string;
  type: string;
  vaultAddress?: string;
  apy7d?: number | null;
  apy30d?: number | null;
  apy90d?: number | null;
  market?: MarketInfo;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`HTTP ${res.status} for ${url}: ${await res.text()}`);
    return null;
  }
  return res.json();
}

async function getMarketReserves(marketAddress: string): Promise<Map<string, MarketInfo>> {
  const data = await fetchJson(`${KAMINO_API}/kamino-market/${marketAddress}/reserves/metrics`);
  const reserves = data?.data ?? data;
  if (!Array.isArray(reserves)) return new Map();

  const map = new Map<string, MarketInfo>();
  for (const r of reserves) {
    const mint = r.reserve?.token?.mint ?? r.liquidityTokenMint ?? r.mint ?? "";
    if (!mint) continue;
    map.set(mint, {
      supplyApy: r.supplyApy ?? null,
      borrowApy: r.borrowApy ?? null,
      totalSupply: r.totalSupply ?? "0",
      totalBorrow: r.totalBorrow ?? "0",
    });
  }
  return map;
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
  console.log(`Loaded ${uniqueMints.length} unique token mints\n`);

  console.log("Fetching Kamino vaults...");
  const vaults = (await fetchJson(`${KAMINO_API}/kvaults/vaults`)) ?? [];
  console.log(`  Found ${vaults.length} vaults`);

  console.log("Fetching xStocks Market reserves...");
  const xstocksReserves = await getMarketReserves(XSTOCKS_MARKET);
  console.log(`  Found ${xstocksReserves.size} reserves`);

  console.log("Fetching principal token yields...");
  const ptYields = (await fetchJson(`${KAMINO_API}/yields/principal-tokens`)) ?? [];
  console.log(`  Found ${ptYields.length} PT yields`);

  console.log("Fetching staking yields...");
  const stakingYields = (await fetchJson(`${KAMINO_API}/v2/staking-yields`)) ?? [];
  console.log(`  Found ${stakingYields.length} staking yields`);

  const ptMap = new Map<string, string>(ptYields.map((p: any) => [p.tokenMint, p.apy]));
  const stMap = new Map<string, string>(stakingYields.map((s: any) => [s.tokenMint, s.apy]));

  const results: ApyResult[] = [];

  for (const asset of uniqueMints) {
    const result: ApyResult = { ...asset, type: "NONE" };

    const vault = vaults.find((v: any) => v.state?.tokenMint === asset.mint);
    if (vault) {
      result.type = "VAULT";
      result.vaultAddress = vault.address;
      try {
        const metrics = await fetchJson(`${KAMINO_API}/kvaults/vaults/${vault.address}/metrics`);
        if (metrics) {
          result.apy7d = metrics.apy7d ?? null;
          result.apy30d = metrics.apy30d ?? null;
          result.apy90d = metrics.apy90d ?? null;
        }
      } catch (err) {
        console.error(`  Error fetching metrics for ${vault.address}: ${err}`);
      }
      await sleep(50);
    }

    const xstocksMarket = xstocksReserves.get(asset.mint);

    if (xstocksMarket) {
      result.type = result.type === "VAULT" ? "VAULT+MARKET" : "MARKET";
      result.market = xstocksMarket;
    }

    if (ptMap.has(asset.mint)) {
      if (result.type === "NONE") result.type = "PT";
      result.apy30d = parseFloat(ptMap.get(asset.mint)!);
    }

    if (stMap.has(asset.mint)) {
      if (result.type === "NONE") result.type = "LST";
      result.apy30d = parseFloat(stMap.get(asset.mint)!);
    }

    results.push(result);
  }

  const active = results.filter((r) => r.type !== "NONE");

  console.log(`\n=== ACTIVE MARKETS (${active.length}) ===`);
  for (const r of active) {
    const apy = r.apy30d != null ? `${(r.apy30d * 100).toFixed(2)}%` : "-";
    const mkt = r.market
      ? `supply=${((r.market.supplyApy ?? 0) * 100).toFixed(2)}% borrow=${((r.market.borrowApy ?? 0) * 100).toFixed(2)}%`
      : "";
    console.log(`  [${r.type.padEnd(12)}] ${r.symbol.padEnd(12)} apy30d=${apy.padEnd(8)} ${mkt}`);
  }

  const outputPath = join(process.cwd(), "lib", "data", "kamino-apy-results.json");
  writeFileSync(
    outputPath,
    JSON.stringify({ fetched_at: new Date().toISOString(), results: active, active_count: active.length }, null, 2)
  );
  console.log(`\nSaved to: ${outputPath}`);
  console.log(`Summary: ${active.length} tokens have active Kamino markets`);
}

main().catch(console.error);

export {};
