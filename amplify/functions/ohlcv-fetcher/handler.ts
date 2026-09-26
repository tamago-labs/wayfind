import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/ohlcv-fetcher";

const CMC_API_KEY = env.CMC_API_KEY ?? "";
const BASE_URL = "https://pro-api.coinmarketcap.com";

export const handler: Schema["ohlcvFetcher"]["functionHandler"] = async (event) => {
  try {
    const { cryptoId, interval, timeStart, timeEnd } = event.arguments as any;

    if (!cryptoId) {
      return { error: "crypto_id required" };
    }

    const url = new URL(`${BASE_URL}/v2/cryptocurrency/ohlcv/historical`);
    url.searchParams.set("id", String(cryptoId));
    url.searchParams.set("convert", "USD");
    if (timeStart) url.searchParams.set("time_start", timeStart);
    if (timeEnd) url.searchParams.set("time_end", timeEnd);
    if (interval) url.searchParams.set("interval", interval);

    console.log("[ohlcv-fetcher] Fetching:", url.toString());

    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { error: `CMC HTTP ${res.status}` };
    }

    const data = await res.json();
    console.log("[ohlcv-fetcher] CMC response keys:", Object.keys(data));

    const cryptoData = data.data?.id ? data.data : (data.data?.[cryptoId] ?? data.data?.[Number(cryptoId)]);

    if (!cryptoData?.quotes) {
      console.log("[ohlcv-fetcher] No quotes found");
      return { data: [] };
    }

    console.log("[ohlcv-fetcher] Found", cryptoData.quotes.length, "quotes");

    const candles = cryptoData.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.time_open).getTime() / 1000),
      open: q.quote?.USD?.open ?? 0,
      high: q.quote?.USD?.high ?? 0,
      low: q.quote?.USD?.low ?? 0,
      close: q.quote?.USD?.close ?? 0,
      volume: q.quote?.USD?.volume ?? 0,
    }));

    return { data: candles };
  } catch (err) {
    console.error("[ohlcv-fetcher] Error:", err);
    return { error: "Failed to fetch OHLCV" };
  }
};
