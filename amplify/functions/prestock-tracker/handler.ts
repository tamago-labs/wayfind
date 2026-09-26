import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/prestock-tracker";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

const PRESTOCKS_API = "https://prestocks.com/api/prestocks";

const EXCLUDED_SYMBOLS = ["SPACEX"];

interface PreStockData {
  symbol: string;
  markPrice: number;
  markValuation: number;
  tokenPrice: number;
  impliedValuation: number;
  supply: number;
}

export const handler = async () => {
  try {
    const res = await fetch(PRESTOCKS_API);
    if (!res.ok) {
      console.error(`[prestock-tracker] API returned ${res.status}`);
      return;
    }

    const data: any[] = await res.json();
    const stocks: PreStockData[] = data
      .filter((item) => !EXCLUDED_SYMBOLS.includes(item.symbol))
      .map((item) => ({
        symbol: item.symbol,
        markPrice: item.markPrice ?? null,
        markValuation: item.markValuation ?? null,
        tokenPrice: item.tokenPrice ?? null,
        impliedValuation: item.impliedValuation ?? null,
        supply: item.supply ?? null,
      }));

    for (const stock of stocks) {
      await dataClient.models.PreStock.create(stock);
    }

    console.log(`[prestock-tracker] stored ${stocks.length} PreStocks`);
  } catch (err) {
    console.error("[prestock-tracker] error:", err);
  }
};
