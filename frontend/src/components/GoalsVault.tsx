'use client';

import { motion } from 'framer-motion';
import { Archive, ArrowUpRight } from 'lucide-react';
import type { Goal } from '@/lib/contract';
import { shortAddr } from '@/lib/contract';

interface Props {
  goals: Goal[];
  loading: boolean;
  activeId: string | null;
  busy: boolean;
  onOpen: (g: Goal) => void;
  onChart: (g: Goal) => void;
}

function progress(g: Goal): string {
  if (g.milestones.length === 0) return 'uncharted';
  const done = g.milestones.filter((m) => m.state === 'DONE').length;
  return `${done}/${g.milestones.length} set`;
}

export function GoalsVault({ goals, loading, activeId, busy, onOpen, onChart }: Props) {
  return (
    <div className="paper-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Archive size={15} className="text-rust" />
        <span className="tick-label">Sheet 03 / goals vault</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full skeleton" style={{ borderRadius: 2 }} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="py-8 text-center">
          <p className="title-serif mb-1 text-lg text-graphite">The vault holds no plans yet</p>
          <p className="mx-auto max-w-sm text-[0.82rem] leading-relaxed text-faint">
            Every objective you forge is filed here as a drawing. Start one above and the first
            keystone goes on the board.
          </p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
          {goals.map((g, i) => {
            const isActive = g.id === activeId;
            return (
              <motion.li
                key={g.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-3 py-3 ${isActive ? 'bg-paper/60' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onOpen(g)}
                    className="group inline-flex items-center gap-1.5 text-left"
                  >
                    <span className="title-serif truncate text-[0.95rem] text-ink group-hover:text-rust">
                      {g.title}
                    </span>
                    <ArrowUpRight size={13} className="shrink-0 text-faint group-hover:text-rust" />
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.64rem] text-faint">
                    <span>{g.id}</span>
                    <span>by {shortAddr(g.author)}</span>
                    <span className="text-graphite">{progress(g)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className="px-2 py-0.5 font-mono text-[0.6rem]"
                    style={{
                      border: '1px solid var(--hairline-strong)',
                      color: g.status === 'ACHIEVED' ? 'rgb(181 71 31)' : 'inherit',
                    }}
                  >
                    {g.status || 'PLANNING'}
                  </span>
                  {g.status === 'PLANNING' && (
                    <button
                      onClick={() => onChart(g)}
                      disabled={busy}
                      className="btn-rust px-2.5 py-1"
                    >
                      Chart
                    </button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
