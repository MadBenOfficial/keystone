'use client';

import { useCallback, useEffect, useState } from 'react';
import { BRADBURY_PARAMS } from '@/lib/contract';

const BRADBURY_CHAIN_ID = '0x107d';

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getEth(): Eth | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ethereum?: Eth }).ethereum ?? null;
}

export interface WalletState {
  address: `0x${string}` | null;
  chainId: string | null;
  balance: string | null;
  connecting: boolean;
  error: string | null;
  hasProvider: boolean;
  onChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

function weiToGen(hex: string, maxFrac = 4): string {
  try {
    const n = BigInt(hex);
    const whole = n / 10n ** 18n;
    const frac = (n % 10n ** 18n)
      .toString()
      .padStart(18, '0')
      .slice(0, maxFrac)
      .replace(/0+$/, '');
    return frac ? `${whole}.${frac}` : whole.toString();
  } catch {
    return '0';
  }
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    setHasProvider(!!getEth());
  }, []);

  const refreshChain = useCallback(async () => {
    const eth = getEth();
    if (!eth) return;
    try {
      const id = (await eth.request({ method: 'eth_chainId' })) as string;
      setChainId(id);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    const eth = getEth();
    if (!eth || !address) return;
    try {
      const bal = (await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      setBalance(weiToGen(bal));
    } catch {
      /* ignore */
    }
  }, [address]);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      setError('No wallet detected. Install a GenLayer compatible wallet to chart a goal.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      try {
        await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
      } catch {
        /* chain may already exist */
      }
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BRADBURY_PARAMS.chainId }],
        });
      } catch {
        /* user may decline the switch */
      }
      setAddress(accounts[0] as `0x${string}`);
      await refreshChain();
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/reject|denied|4001/i.test(msg)) setError('You cancelled the connection.');
      else setError('Could not connect to the wallet.');
    } finally {
      setConnecting(false);
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  useEffect(() => {
    const eth = getEth();
    if (!eth || !eth.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      if (!accs || accs.length === 0) setAddress(null);
      else setAddress(accs[0] as `0x${string}`);
    };
    const onChainChanged = (...args: unknown[]) => setChainId(args[0] as string);
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChainChanged);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  useEffect(() => {
    if (address) refreshBalance();
  }, [address, refreshBalance]);

  const onChain = (chainId ?? '').toLowerCase() === BRADBURY_CHAIN_ID;

  return {
    address,
    chainId,
    balance,
    connecting,
    error,
    hasProvider,
    onChain,
    connect,
    disconnect,
    refreshBalance,
  };
}
