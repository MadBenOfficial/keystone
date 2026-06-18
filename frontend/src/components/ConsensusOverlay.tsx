'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { PenLine, ExternalLink } from 'lucide-react';
import type { LeaderDraft } from '@/lib/contract';
import { EXPLORER } from '@/lib/contract';

interface Props {
  open: boolean;
  phase: string;
  status: string;
  draft: LeaderDraft | null;
  txHash: string | null;
  label: string;
}

// Honest status names, not invented marketing words.
const NICE: Record<string, string> = {
  WALLET: 'Awaiting your signature',
  SUBMITTED: 'Transaction submitted',
  PENDING: 'Queued on Bradbury',
  PROPOSING: 'Leader proposing the draft',
  COMMITTING: 'Validators committing',
  REVEALING: 'Validators revealing',
  ACCEPTED: 'Accepted by consensus',
  FINALIZED: 'Finalized on-chain',
  UNDETERMINED: 'Undetermined - rotating',
  VALIDATORS_TIMEOUT: 'Validators timed out - retrying',
  LEADER_TIMEOUT: 'Leader timed out - rotating',
};

export function ConsensusOverlay({ open, phase, status, draft, txHash, label }: Props) {
  const nice = NICE[status] ?? status;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-paper/80 backdrop-blur-[3px]" aria-hidden />
          <motion.div
            initial={{ scale: 0.97, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="relative w-[min(95vw,640px)] bg-paper p-6"
            style={{ border: '1px solid var(--hairline-strong)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Strategist drafting"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [-6, 8, -6] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                >
                  <PenLine size={18} className="text-rust" />
                </motion.span>
                <span className="tick-label">{label}</span>
              </div>
              <span className="font-mono text-[0.7rem] text-graphite">{nice}</span>
            </div>

            <div className="mb-4 h-1 w-full overflow-hidden bg-paper2" style={{ border: '1px solid var(--hairline)' }}>
              <motion.div
                className="h-full bg-rust"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                style={{ width: '40%' }}
              />
            </div>

            {phase === 'chart' && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="tick-label">Strategist draft (leader peek)</span>
                  {draft?.feasibility !== undefined && (
                    <span className="font-mono text-[0.72rem] text-ink">
                      feasibility <span className="text-rust">{draft.feasibility}</span>/100
                    </span>
                  )}
                </div>
                <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {draft && draft.milestones.length > 0 ? (
                    draft.milestones.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-2 bg-paper2/60 px-3 py-2"
                        style={{ borderLeft: '2px solid rgb(181 71 31)' }}
                      >
                        <span className="font-mono text-[0.66rem] text-faint">M{i + 1}</span>
                        <div>
                          <div className="title-serif text-[0.82rem] text-ink">{m.title}</div>
                          {m.rationale && (
                            <div className="text-[0.72rem] leading-snug text-graphite">{m.rationale}</div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-12 w-full skeleton" style={{ borderRadius: 2 }} />
                      ))}
                      <p className="pt-1 text-center font-mono text-[0.68rem] text-faint">
                        The Strategist is drawing the graph. Validators will independently agree on
                        feasibility before it is committed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase !== 'chart' && (
              <p className="text-[0.84rem] leading-relaxed text-graphite">
                Your transaction is moving through Bradbury consensus. Leader and validator timeouts
                are normal here - the network rotates and keeps going. Keep this open; it resolves on
                its own.
              </p>
            )}

            {txHash && (
              <a
                href={`${EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[0.72rem] text-rust hover:underline"
              >
                <ExternalLink size={12} /> Follow on the explorer
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
