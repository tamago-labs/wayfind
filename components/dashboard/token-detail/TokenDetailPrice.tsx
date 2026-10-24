"use client";

import type { Token } from "@/lib/types/token";
import PriceChart from "../PriceChart";

export default function TokenDetailPrice({ token, asset }: { token: Token; asset: any }) {
  // if (token.addresses?.solana || token.addresses?.ethereum || token.addresses?.bnb || token.addresses?.arbitrum) {
  //   return <PriceChart token={token} asset={asset} />;
  // }
  return <PriceChart token={token} asset={asset} />;
}
