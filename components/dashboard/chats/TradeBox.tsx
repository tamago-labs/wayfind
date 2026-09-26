'use client';

import { useState } from 'react';
import { getToken } from '@/lib/tokens/token-registry';

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58ToBytes(b58: string): Uint8Array {
  let num = BigInt(0);
  for (let i = 0; i < b58.length; i++) {
    num = num * BigInt(58) + BigInt(B58.indexOf(b58[i]));
  }
  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num & BigInt(0xff)));
    num = num >> BigInt(8);
  }
  let leadingZeros = 0;
  for (let i = 0; i < b58.length && b58[i] === "1"; i++) leadingZeros++;
  return new Uint8Array([...Array(leadingZeros).fill(0), ...bytes]);
}

export interface TradeData {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  estimatedOutput: number;
  price: number;
  priceImpact: string;
  route: string[];
  status?: string;
  createdAt?: string;
  signature?: string;
}

interface TradeBoxProps {
  trade: TradeData;
  onExecuted: (signature: string) => void;
  onError: (msg: string) => void;
  onCancel: () => void;
  signAndSend: ((tx: { transaction: Uint8Array }) => Promise<{ signature: Uint8Array }>) | null;
  walletAddress?: string;
}

export default function TradeBox({ trade, onExecuted, onError, onCancel, signAndSend, walletAddress }: TradeBoxProps) {
  const [executing, setExecuting] = useState(false);

  const handleConfirm = async () => {
    if (!signAndSend) {
      onError('Wallet not connected');
      return;
    }
    setExecuting(true);

    const fromToken = getToken(trade.tokenIn);
    const toToken = getToken(trade.tokenOut);

    if (!fromToken || !toToken) {
      onError(`Unknown token: ${!fromToken ? trade.tokenIn : trade.tokenOut}`);
      setExecuting(false);
      return;
    }

    const fromAddr = fromToken.mint;
    const toAddr = toToken.mint;
    const decimals = fromToken.decimals;
    const rawAmount = Math.round(trade.amountIn * Math.pow(10, decimals)).toString();

    try {
      const params = new URLSearchParams({
        fromTokenAddress: fromAddr,
        toTokenAddress: toAddr,
        amount: rawAmount,
        userWalletAddress: walletAddress ?? "",
        slippagePercent: "0.5",
      });
      const res = await fetch(`/api/swap-instruction?${params}`);
      const json = await res.json();

      if (json.error) {
        onError(json.error);
        setExecuting(false);
        return;
      }

      const txBytes = base58ToBytes(json.base58Transaction);
      const { signature } = await signAndSend({ transaction: txBytes });
      const sigStr = Buffer.from(signature).toString('hex');
      onExecuted(sigStr);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border3/50 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">Trade</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-[11px] text-white/40 mb-0.5">You pay</p>
          <p className="text-[14px] font-medium text-white/90">{trade.amountIn} {trade.tokenIn}</p>
        </div>
        <div className="text-white/30 text-lg">→</div>
        <div className="text-center">
          <p className="text-[11px] text-white/40 mb-0.5">You receive</p>
          <p className="text-[14px] font-medium text-white/90">{trade.estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 6 })} {trade.tokenOut}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/40 mb-3">
        <span>Price: {trade.price < 1 ? trade.price.toFixed(6) : trade.price.toFixed(2)} {trade.tokenOut}/{trade.tokenIn}</span>
        <span>Impact: {trade.priceImpact}%</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={executing}
          className="flex-1 h-8 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
        >
          {executing ? 'Executing…' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          disabled={executing}
          className="flex-1 h-8 rounded-lg bg-white/[0.05] text-white/60 text-[12px] font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
