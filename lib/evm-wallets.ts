import { ethers } from "ethers";
import { getChainById, getAddChainParams, type ChainConfig } from "./chains";

export interface EVMWallet {
  info: EIP6963Info;
  provider: EIP1193Provider;
}

export interface EIP6963Info {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function discoverWallets(timeoutMs = 400): Promise<EVMWallet[]> {
  return new Promise((resolve) => {
    const wallets = new Map<string, EVMWallet>();

    function handleProvider(event: Event) {
      const { info, provider } = (event as CustomEvent<{ info: EIP6963Info; provider: EIP1193Provider }>).detail;
      wallets.set(info.uuid, { info, provider });
    }

    window.addEventListener("eip6963:announceProvider", handleProvider as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handleProvider as EventListener);
      resolve(Array.from(wallets.values()));
    }, timeoutMs);
  });
}

export async function connectEVMWallet(wallet: EVMWallet): Promise<{
  address: string;
  chainId: number;
  provider: ethers.BrowserProvider;
}> {
  await wallet.provider.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(wallet.provider as unknown as ethers.Eip1193Provider);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  return { address, chainId: Number(network.chainId), provider };
}

export async function switchChain(provider: EIP1193Provider, chainId: number) {
  const hex = `0x${chainId.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e?.code === 4902 || e?.code === -32603) {
      const chain = getChainById(chainId);
      if (chain) {
        await provider.request({ method: "wallet_addEthereumChain", params: [getAddChainParams(chain)] });
      }
    } else {
      throw err;
    }
  }
}
