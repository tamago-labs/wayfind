import { NextRequest, NextResponse } from "next/server";
import getConfig from "next/config";
import crypto from "crypto";

const { serverRuntimeConfig } = getConfig();
const OKX_API_KEY = serverRuntimeConfig.OKX_API_KEY;
const OKX_SECRET_KEY = serverRuntimeConfig.OKX_SECRET_KEY;
const OKX_PASSPHRASE = serverRuntimeConfig.OKX_PASSPHRASE;

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const fromTokenAddress = searchParams.get("fromTokenAddress");
  const toTokenAddress = searchParams.get("toTokenAddress");
  const amount = searchParams.get("amount");

  if (!fromTokenAddress || !toTokenAddress || !amount) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "OKX API credentials not configured" }, { status: 500 });
  }

  try {
    const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
    url.searchParams.set("chainIndex", "501");
    url.searchParams.set("amount", amount);
    url.searchParams.set("fromTokenAddress", fromTokenAddress);
    url.searchParams.set("toTokenAddress", toTokenAddress);

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
      return NextResponse.json({ error: `OKX API HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();

    if (json.code !== "0") {
      return NextResponse.json({ error: json.msg || "OKX API error" }, { status: 400 });
    }

    const quote = json.data?.[0];
    if (!quote) {
      return NextResponse.json({ error: "No quote available" }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (err) {
    console.error("[Quote API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
