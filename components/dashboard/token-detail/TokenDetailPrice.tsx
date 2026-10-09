"use client";

import type { Token } from "@/lib/types/token";
import PriceChart from "../PriceChart";
import SolanaPriceChart from "../SolanaPriceChart";

export default function TokenDetailPrice({ token, asset }: { token: Token; asset: any }) {
  if (token.addresses?.solana) {
    return <SolanaPriceChart token={token} asset={asset} />;
  }
  return <PriceChart token={token} />;
}