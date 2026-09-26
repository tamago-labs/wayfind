import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/get-liquidity";

let cachedLogos: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60;

function sign(timestamp: string, method: string, requestPath: string): string {
  const prehash = timestamp + method + requestPath;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

export async function GET(req: NextRequest) {
  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const now = Date.now();
  if (cachedLogos && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ logos: cachedLogos });
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("chainIndex", "501");

    const path = url.pathname + url.search;
    const timestamp = new Date().toISOString();
    const signature = sign(timestamp, "GET", path);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ logos: FALLBACK_LOGOS });
    }

    const json = await res.json();
    if (json.code !== "0") {
      return NextResponse.json({ logos: FALLBACK_LOGOS });
    }

    const logos: Record<string, string> = { ...FALLBACK_LOGOS };
    for (const source of json.data) {
      logos[source.name] = source.logo;
    }

    cachedLogos = logos;
    cacheTime = now;

    return NextResponse.json({ logos });
  } catch {
    return NextResponse.json({ logos: FALLBACK_LOGOS });
  }
}

const FALLBACK_LOGOS: Record<string, string> = {
  Raydium: "https://static.okx.com/cdn/web3/dex/logo/raydium.png",
  "Raydium Stable": "https://static.okx.com/cdn/web3/dex/logo/raydium_stable.png",
  "Raydium CL": "https://static.okx.com/cdn/web3/dex/logo/raydium_cl.png",
  "Raydium CPMM": "https://static.okx.com/cdn/web3/dex/logo/raydium_cpmm.png",
  "OpenBook V2": "https://static.okx.com/cdn/web3/dex/logo/openbook_v2.png",
  Phoenix: "https://static.okx.com/cdn/web3/dex/logo/phoenix.png",
  Sanctum: "https://static.okx.com/cdn/web3/dex/logo/sanctum.png",
  "Sanctum Infinity": "https://static.okx.com/cdn/web3/dex/logo/sanctum_infinity.png",
  Orca: "https://static.okx.com/cdn/web3/dex/logo/orca.png",
  "Orca V1": "https://static.okx.com/cdn/web3/dex/logo/orca_v1.png",
  "Token Swap": "https://static.okx.com/cdn/web3/dex/logo/token_swap.png",
  Fluxbeam: "https://static.okx.com/cdn/web3/dex/logo/fluxbeam.png",
  Saros: "https://static.okx.com/cdn/web3/dex/logo/saros.png",
  "Obric V2": "https://static.okx.com/cdn/web3/dex/logo/obric_v2.png",
  AldrinSwap: "https://static.okx.com/cdn/web3/dex/logo/aldrinswap.png",
  AldrinSwapV1: "https://static.okx.com/cdn/web3/dex/logo/aldrinswapv1.png",
  Saber: "https://static.okx.com/cdn/web3/dex/logo/saber.png",
  "Orca Whirlpools": "https://static.okx.com/cdn/web3/dex/logo/orca_whirlpools.png",
  Meteora: "https://static.okx.com/cdn/web3/dex/logo/meteora.png",
  "Lifinity V1": "https://static.okx.com/cdn/web3/dex/logo/lifinity_v1.png",
  "Meteora DLMM": "https://static.okx.com/cdn/web3/dex/logo/meteora_dlmm.png",
  "Pump.fun": "https://static.okx.com/cdn/web3/dex/logo/pump_fun.png",
  "stabble Stable Swap": "https://static.okx.com/cdn/web3/dex/logo/stabble_stable_swap.png",
  "stabble Weighted Swap": "https://static.okx.com/cdn/web3/dex/logo/stabble_weighted_swap.png",
  "Meteora Dynamic Vault": "https://static.okx.com/cdn/web3/dex/logo/meteora_dynamic_vault.png",
  "Virtual.fun": "https://static.okx.com/cdn/web3/dex/logo/virtual_fun.png",
  ZeroFi: "https://static.okx.com/cdn/web3/dex/logo/zerofi.png",
  PumpSwap: "https://static.okx.com/cdn/web3/dex/logo/pumpswap.png",
  LaunchLab: "https://static.okx.com/cdn/web3/dex/logo/launchlab.png",
  "Letsbonk.Fun": "https://static.okx.com/cdn/web3/dex/logo/letsbonk_fun.png",
  "Jupiter Perps": "https://static.okx.com/cdn/web3/dex/logo/jupiter_perps.png",
  Vertigo: "https://static.okx.com/cdn/web3/dex/logo/vertigo.png",
  "Meteora DBC": "https://static.okx.com/cdn/web3/dex/logo/meteora_dbc.png",
  Believe: "https://static.okx.com/cdn/web3/dex/logo/believe.png",
  Bags: "https://static.okx.com/cdn/web3/dex/logo/bags.png",
  "Meteora Damm V2": "https://static.okx.com/cdn/web3/dex/logo/meteora_damm_v2.png",
  woofi: "https://static.okx.com/cdn/web3/dex/logo/woofi.png",
  "Boop.fun": "https://static.okx.com/cdn/web3/dex/logo/boop_fun.png",
  Gavel: "https://static.okx.com/cdn/web3/dex/logo/gavel.png",
  Manifest: "https://static.okx.com/cdn/web3/dex/logo/manifest.png",
  "Saber Decimal Wrappers": "https://static.okx.com/cdn/web3/dex/logo/saber_decimal_wrappers.png",
  "Saros DLMM": "https://static.okx.com/cdn/web3/dex/logo/saros_dlmm.png",
  "Byreal CLMM": "https://static.okx.com/cdn/web3/dex/logo/byreal_clmm.png",
  TesseraV: "https://static.okx.com/cdn/web3/dex/logo/tesserav.png",
  "PancakeSwap V3": "https://static.okx.com/cdn/web3/dex/logo/pancakeswap_v3.png",
  Heaven: "https://static.okx.com/cdn/web3/dex/logo/heaven.png",
  "SolFi V2": "https://static.okx.com/cdn/web3/dex/logo/solfi_v2.png",
  Moonit: "https://static.okx.com/cdn/web3/dex/logo/moonit.png",
  GoonFi: "https://static.okx.com/cdn/web3/dex/logo/goonfi.png",
  "Sugar.money": "https://static.okx.com/cdn/web3/dex/logo/sugar_money.png",
  Whalestreet: "https://static.okx.com/cdn/web3/dex/logo/whalestreet.png",
  AlphaQ: "https://static.okx.com/cdn/web3/dex/logo/alphaq.png",
  "Jupiter Lend": "https://static.okx.com/cdn/web3/dex/logo/jupiter_lend.png",
  "Jup Lend AMM": "https://static.okx.com/cdn/web3/dex/logo/jup_lend_amm.png",
  TaurusFi: "https://static.okx.com/cdn/web3/dex/logo/taurusfi.png",
  BisonFi: "https://static.okx.com/cdn/web3/dex/logo/bisonfi.png",
  "GoonFi V2": "https://static.okx.com/cdn/web3/dex/logo/goonfi_v2.png",
  "Quantum pAMM": "https://static.okx.com/cdn/web3/dex/logo/quantum_pamm.png",
  "Abyss AMM": "https://static.okx.com/cdn/web3/dex/logo/abyss_amm.png",
  Aquifer: "https://static.okx.com/cdn/web3/dex/logo/aquifer.png",
  Hadron: "https://static.okx.com/cdn/web3/dex/logo/hadron.png",
  "Fusion AMM": "https://static.okx.com/cdn/web3/dex/logo/fusion_amm.png",
  Riptide: "https://static.okx.com/cdn/web3/dex/logo/riptide.png",
  FluxMM: "https://static.okx.com/cdn/web3/dex/logo/fluxmm.png",
  "Moonpay Trade": "https://static.okx.com/cdn/web3/dex/logo/moonpay_trade.png",
  Archer: "https://static.okx.com/cdn/web3/dex/logo/archer.png",
  Deriverse: "https://static.okx.com/cdn/web3/dex/logo/deriverse.png",
  Denali: "https://static.okx.com/cdn/web3/dex/logo/denali.png",
  Ghost: "https://static.okx.com/cdn/web3/dex/logo/ghost.png",
};
