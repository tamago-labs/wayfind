// OKX DEX Script 2: Get all liquidity sources on Solana
// Endpoint: GET /api/v6/dex/aggregator/get-liquidity
// Chain: Solana (chainIndex=501)
// Usage: npx tsx scripts/solana/2-get-liquidity.ts

import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;

if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
  console.error("Error: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE required in .env.local");
  process.exit(1);
}

const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/get-liquidity";
const CHAIN_INDEX = "501";

interface LiquiditySource {
  id: string;
  name: string;
  logo: string;
}

interface ApiResponse {
  code: string;
  data: LiquiditySource[];
  msg: string;
}

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

async function main() {
  console.log(`=== OKX DEX: Liquidity Sources on Solana (chainIndex=${CHAIN_INDEX}) ===\n`);

  const url = new URL(BASE_URL);
  url.searchParams.set("chainIndex", CHAIN_INDEX);

  const path = url.pathname + url.search;
  const timestamp = new Date().toISOString();
  const signature = sign(timestamp, "GET", path);

  console.log(`Fetching: ${url.toString()}\n`);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "OK-ACCESS-KEY": OKX_API_KEY!,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE!,
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const json = (await res.json()) as ApiResponse;

  if (json.code !== "0") {
    console.error(`API error: code=${json.code}, msg=${json.msg}`);
    process.exit(1);
  }

  const sources = json.data;
  console.log(`Total liquidity sources: ${sources.length}\n`);

  console.log(`${"ID".padEnd(6)} ${"Name".padEnd(25)} Logo`);
  console.log("─".repeat(100));

  for (const s of sources) {
    console.log(`${s.id.padEnd(6)} ${s.name.padEnd(25)} ${s.logo}`);
  }

  console.log("\n--- Raw Response (first 5) ---");
  console.log(JSON.stringify(sources.slice(0, 5), null, 2));
}

main().catch(console.error);


// ◇ injected env (6) from .env.local // tip: ◈ secrets for agents [www.dotenvx.com]
// === OKX DEX: Liquidity Sources on Solana (chainIndex=501) ===

// Fetching: https://web3.okx.com/api/v6/dex/aggregator/get-liquidity?chainIndex=501

// Total liquidity sources: 69

// ID     Name                      Logo
// ────────────────────────────────────────────────────────────────────────────────────────────────────
// 277    Raydium                   https://static.okx.com/cdn/web3/dex/logo/raydium.png
// 279    Raydium Stable            https://static.okx.com/cdn/web3/dex/logo/raydium_stable.png
// 278    Raydium CL                https://static.okx.com/cdn/web3/dex/logo/raydium_cl.png
// 343    Raydium CPMM              https://static.okx.com/cdn/web3/dex/logo/raydium_cpmm.png
// 345    OpenBook V2               https://static.okx.com/cdn/web3/dex/logo/openbook_v2.png
// 357    Phoenix                   https://static.okx.com/cdn/web3/dex/logo/phoenix.png
// 372    Sanctum                   https://static.okx.com/cdn/web3/dex/logo/sanctum.png
// 403    Sanctum Infinity          https://static.okx.com/cdn/web3/dex/logo/sanctum_infinity.png
// 72     Orca                      https://static.okx.com/cdn/web3/dex/logo/orca.png
// 6490   Orca V1                   https://static.okx.com/cdn/web3/dex/logo/orca_v1.png
// 73     Token Swap                https://static.okx.com/cdn/web3/dex/logo/token_swap.png
// 337    Fluxbeam                  https://static.okx.com/cdn/web3/dex/logo/fluxbeam.png
// 75     Saros                     https://static.okx.com/cdn/web3/dex/logo/saros.png
// 382    Obric V2                  https://static.okx.com/cdn/web3/dex/logo/obric_v2.png
// 79     AldrinSwap                https://static.okx.com/cdn/web3/dex/logo/aldrinswap.png
// 78     AldrinSwapV1              https://static.okx.com/cdn/web3/dex/logo/aldrinswapv1.png
// 77     Saber                     https://static.okx.com/cdn/web3/dex/logo/saber.png
// 103    Orca Whirlpools           https://static.okx.com/cdn/web3/dex/logo/orca_whirlpools.png
// 284    Meteora                   https://static.okx.com/cdn/web3/dex/logo/meteora.png
// 292    Lifinity V1               https://static.okx.com/cdn/web3/dex/logo/lifinity_v1.png
// 338    Meteora DLMM              https://static.okx.com/cdn/web3/dex/logo/meteora_dlmm.png
// 342    Pump.fun                  https://static.okx.com/cdn/web3/dex/logo/pump_fun.png
// 407    stabble Stable Swap       https://static.okx.com/cdn/web3/dex/logo/stabble_stable_swap.png
// 414    stabble Weighted Swap     https://static.okx.com/cdn/web3/dex/logo/stabble_weighted_swap.png
// 410    Meteora Dynamic Vault     https://static.okx.com/cdn/web3/dex/logo/meteora_dynamic_vault.png
// 420    Virtual.fun               https://static.okx.com/cdn/web3/dex/logo/virtual_fun.png
// 429    ZeroFi                    https://static.okx.com/cdn/web3/dex/logo/zerofi.png
// 444    PumpSwap                  https://static.okx.com/cdn/web3/dex/logo/pumpswap.png
// 451    LaunchLab                 https://static.okx.com/cdn/web3/dex/logo/launchlab.png
// 456    Letsbonk.Fun              https://static.okx.com/cdn/web3/dex/logo/letsbonk_fun.png
// 453    Jupiter Perps             https://static.okx.com/cdn/web3/dex/logo/jupiter_perps.png
// 455    Vertigo                   https://static.okx.com/cdn/web3/dex/logo/vertigo.png
// 457    Meteora DBC               https://static.okx.com/cdn/web3/dex/logo/meteora_dbc.png
// 471    Believe                   https://static.okx.com/cdn/web3/dex/logo/believe.png
// 6540   Bags                      https://static.okx.com/cdn/web3/dex/logo/bags.png
// 459    Meteora Damm V2           https://static.okx.com/cdn/web3/dex/logo/meteora_damm_v2.png
// 461    woofi                     https://static.okx.com/cdn/web3/dex/logo/woofi.png
// 462    Boop.fun                  https://static.okx.com/cdn/web3/dex/logo/boop_fun.png
// 463    Gavel                     https://static.okx.com/cdn/web3/dex/logo/gavel.png
// 475    Manifest                  https://static.okx.com/cdn/web3/dex/logo/manifest.png
// 467    Saber Decimal Wrappers    https://static.okx.com/cdn/web3/dex/logo/saber_decimal_wrappers.png
// 472    Saros DLMM                https://static.okx.com/cdn/web3/dex/logo/saros_dlmm.png
// 477    Byreal CLMM               https://static.okx.com/cdn/web3/dex/logo/byreal_clmm.png
// 480    TesseraV                  https://static.okx.com/cdn/web3/dex/logo/tesserav.png
// 483    PancakeSwap V3            https://static.okx.com/cdn/web3/dex/logo/pancakeswap_v3.png
// 514    Heaven                    https://static.okx.com/cdn/web3/dex/logo/heaven.png
// 521    SolFi V2                  https://static.okx.com/cdn/web3/dex/logo/solfi_v2.png
// 530    Moonit                    https://static.okx.com/cdn/web3/dex/logo/moonit.png
// 534    GoonFi                    https://static.okx.com/cdn/web3/dex/logo/goonfi.png
// 576    Sugar.money               https://static.okx.com/cdn/web3/dex/logo/sugar_money.png
// 578    Whalestreet               https://static.okx.com/cdn/web3/dex/logo/whalestreet.png
// 585    AlphaQ                    https://static.okx.com/cdn/web3/dex/logo/alphaq.png
// 6514   Jupiter Lend              https://static.okx.com/cdn/web3/dex/logo/jupiter_lend.png
// 6694   Jup Lend AMM              https://static.okx.com/cdn/web3/dex/logo/jup_lend_amm.png
// 6535   TaurusFi                  https://static.okx.com/cdn/web3/dex/logo/taurusfi.png
// 6539   BisonFi                   https://static.okx.com/cdn/web3/dex/logo/bisonfi.png
// 6541   GoonFi V2                 https://static.okx.com/cdn/web3/dex/logo/goonfi_v2.png
// 6550   Quantum pAMM              https://static.okx.com/cdn/web3/dex/logo/quantum_pamm.png
// 6586   Abyss AMM                 https://static.okx.com/cdn/web3/dex/logo/abyss_amm.png
// 6565   Aquifer                   https://static.okx.com/cdn/web3/dex/logo/aquifer.png
// 6666   Hadron                    https://static.okx.com/cdn/web3/dex/logo/hadron.png
// 6568   Fusion AMM                https://static.okx.com/cdn/web3/dex/logo/fusion_amm.png
// 6604   Riptide                   https://static.okx.com/cdn/web3/dex/logo/riptide.png
// 6637   FluxMM                    https://static.okx.com/cdn/web3/dex/logo/fluxmm.png
// 6643   Moonpay Trade             https://static.okx.com/cdn/web3/dex/logo/moonpay_trade.png
// 6653   Archer                    https://static.okx.com/cdn/web3/dex/logo/archer.png
// 6674   Deriverse                 https://static.okx.com/cdn/web3/dex/logo/deriverse.png
// 6672   Denali                    https://static.okx.com/cdn/web3/dex/logo/denali.png
// 6688   Ghost                     https://static.okx.com/cdn/web3/dex/logo/ghost.png
