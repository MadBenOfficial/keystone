'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    n: '01',
    h: 'Forge',
    b: 'You record an objective on-chain as a goal in PLANNING status. No AI runs yet - this is a plain, deterministic write that reserves the goal id.',
  },
  {
    n: '02',
    h: 'Chart',
    b: 'The Strategist decomposes the objective into four to eight milestones with prerequisite edges. Validators independently re-run it and must agree on the feasibility reading before it commits.',
  },
  {
    n: '03',
    h: 'Repair',
    b: 'A deterministic backstop keeps only edges that point strictly backward, so the stored graph is always a clean DAG. Roots with no prerequisites start UNLOCKED.',
  },
  {
    n: '04',
    h: 'Set keystones',
    b: 'Completing an unlocked milestone marks it DONE and cascades unlocks to every dependent whose prerequisites are now satisfied. When all are DONE, the goal is ACHIEVED.',
  },
];

export function HowItWorks() {
  return (
    <section className="paper-card p-5">
      <div className="tick-label mb-3">Sheet 04 / the drafting rite</div>
      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: 'var(--hairline)' }}>
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.08 }}
            className="bg-paper p-4"
          >
            <div className="title-serif text-2xl text-rust">{s.n}</div>
            <div className="title-serif mb-1 text-base text-ink">{s.h}</div>
            <p className="text-[0.78rem] leading-relaxed text-graphite">{s.b}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
