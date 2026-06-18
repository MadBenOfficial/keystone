'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { LIMITS } from '@/lib/contract';

interface Props {
  disabled: boolean;
  onForge: (title: string, objective: string) => void;
}

export function ObjectiveComposer({ disabled, onForge }: Props) {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');

  const tOk = title.trim().length >= LIMITS.title.min && title.trim().length <= LIMITS.title.max;
  const oOk =
    objective.trim().length >= LIMITS.objective.min &&
    objective.trim().length <= LIMITS.objective.max;
  const ready = tOk && oOk && !disabled;

  return (
    <div className="relative paper-card p-5 regmark">
      <div className="mb-3 flex items-center gap-2">
        <PenLine size={15} className="text-rust" />
        <span className="tick-label">Sheet 02 / objective composer</span>
      </div>
      <h3 className="title-serif mb-1 text-lg text-ink">State the objective to be planned</h3>
      <p className="mb-4 max-w-prose text-[0.84rem] leading-relaxed text-graphite">
        Forging records the goal on-chain in PLANNING status. Charting then sends it to the
        Strategist, which drafts the milestone graph under validator consensus.
      </p>

      <label className="tick-label mb-1 block">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={LIMITS.title.max}
        placeholder="Launch a neighborhood tool library"
        className="mb-1 w-full bg-paper px-3 py-2 font-body text-[0.9rem] text-ink placeholder:text-faint"
        style={{ border: '1px solid var(--hairline-strong)' }}
        disabled={disabled}
      />
      <div className="mb-3 text-right font-mono text-[0.62rem] text-faint">
        {title.trim().length}/{LIMITS.title.max}
      </div>

      <label className="tick-label mb-1 block">Objective</label>
      <textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        maxLength={LIMITS.objective.max}
        rows={3}
        placeholder="Describe the goal, its scope, and what done looks like. The Strategist turns this into a dependency graph of milestones."
        className="w-full resize-none bg-paper px-3 py-2 font-body text-[0.9rem] text-ink placeholder:text-faint"
        style={{ border: '1px solid var(--hairline-strong)' }}
        disabled={disabled}
      />
      <div className="mb-4 text-right font-mono text-[0.62rem] text-faint">
        {objective.trim().length}/{LIMITS.objective.max}
      </div>

      <motion.button
        whileTap={{ scale: ready ? 0.98 : 1 }}
        className="btn-rust px-5 py-2.5"
        disabled={!ready}
        onClick={() => {
          onForge(title.trim(), objective.trim());
          setTitle('');
          setObjective('');
        }}
      >
        Forge goal
      </motion.button>
    </div>
  );
}
