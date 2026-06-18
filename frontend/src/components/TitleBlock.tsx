'use client';

import { motion } from 'framer-motion';
import { Wallet, LogOut, Droplet } from 'lucide-react';
import type { WalletState } from '@/hooks/useWallet';
import { shortAddr, FAUCET, CONTRACT_ADDRESS, IS_DEPLOYED } from '@/lib/contract';

interface Props {
  wallet: WalletState;
}

// An architectural title block, docked bottom-right like a real drawing sheet.
export function TitleBlock({ wallet }: Props) {
  const { address, balance, connecting, hasProvider, onChain, connect, disconnect } = wallet;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 26 }}
      className="fixed bottom-3 right-3 z-50 w-[min(92vw,330px)] bg-paper/95 backdrop-blur"
      style={{ border: '1px solid var(--hairline-strong)' }}
      aria-label="Drawing title block"
    >
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--hairline)' }}>
        <div className="col-span-2 p-3">
          <div className="tick-label">Project</div>
          <div className="title-serif text-base leading-tight text-ink">keystone</div>
          <div className="font-mono text-[0.6rem] text-faint">AI dependency planner</div>
        </div>
        <div className="p-3">
          <div className="tick-label">Sheet</div>
          <div className="title-serif text-base text-rust">01</div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="col-span-1 p-3">
          <div className="tick-label">Net</div>
          <div className="font-mono text-[0.66rem] text-ink">Bradbury</div>
          <div className={`font-mono text-[0.58rem] ${onChain ? 'text-rust' : 'text-faint'}`}>
            {address ? (onChain ? 'on-chain' : 'switch net') : 'testnet'}
          </div>
        </div>
        <div className="col-span-2 p-3">
          <div className="tick-label">Contract</div>
          <div className="font-mono text-[0.62rem] text-graphite">
            {IS_DEPLOYED ? shortAddr(CONTRACT_ADDRESS, 8, 6) : 'not wired'}
          </div>
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: 'var(--hairline)' }}>
        {address ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="tick-label">Drafter</div>
              <div className="font-mono text-[0.7rem] text-ink">{shortAddr(address)}</div>
              <div className="font-mono text-[0.58rem] text-faint">
                {balance ?? '0'} GEN
              </div>
            </div>
            <button
              onClick={disconnect}
              className="btn-ghost inline-flex items-center gap-1 px-2 py-1"
              aria-label="Disconnect wallet"
            >
              <LogOut size={11} /> exit
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="btn-rust flex w-full items-center justify-center gap-1.5 py-2"
          >
            <Wallet size={13} /> {connecting ? 'connecting...' : hasProvider ? 'connect wallet' : 'no wallet found'}
          </button>
        )}
        <a
          href={FAUCET}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.62rem] text-rust hover:underline"
        >
          <Droplet size={11} /> Claim testnet GEN from the faucet
        </a>
      </div>
    </motion.aside>
  );
}
