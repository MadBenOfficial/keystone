'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Check } from 'lucide-react';
import type { Goal, Milestone } from '@/lib/contract';
import { layoutGraph, NODE_W, NODE_H, type LaidNode } from '@/lib/layout';

interface Props {
  goal: Goal | null;
  busyIdx: number | null;
  canComplete: boolean;
  onComplete: (idx: number) => void;
}

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(40, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function GraphBoard({ goal, busyIdx, canComplete, onComplete }: Props) {
  const layout = useMemo(
    () => (goal ? layoutGraph(goal.milestones) : null),
    [goal],
  );

  if (!goal || goal.milestones.length === 0 || !layout) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
        <div className="tick-label mb-3">Sheet 01 / dependency board</div>
        <p className="title-serif max-w-md text-lg text-graphite">
          {goal
            ? 'This goal is forged but not yet charted. Send it to the Strategist to draft its milestone graph.'
            : 'No goal is on the board. Forge an objective below, then chart it to draw the dependency graph here.'}
        </p>
      </div>
    );
  }

  const doneCount = goal.milestones.filter((m) => m.state === 'DONE').length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="tick-label">Sheet 01 / dependency board</div>
          <h2 className="title-serif text-xl text-ink">{goal.title}</h2>
        </div>
        <div className="flex items-center gap-4 font-mono text-[0.7rem] text-graphite">
          <span>
            FEAS <span className="text-rust">{goal.feasibility}</span>/100
          </span>
          <span>
            DONE {doneCount}/{goal.milestones.length}
          </span>
          <span
            className="px-2 py-0.5"
            style={{ border: '1px solid var(--hairline-strong)' }}
          >
            {goal.status}
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto" style={{ border: '1px solid var(--hairline)' }}>
        <svg
          width={layout.width}
          height={Math.max(layout.height, 300)}
          viewBox={`0 0 ${layout.width} ${Math.max(layout.height, 300)}`}
          className="block"
          role="img"
          aria-label={`Dependency graph for ${goal.title}`}
        >
          {/* prerequisite edges */}
          {layout.edges.map((e, i) => {
            const x1 = e.from.x + NODE_W;
            const y1 = e.from.y + NODE_H / 2;
            const x2 = e.to.x;
            const y2 = e.to.y + NODE_H / 2;
            const live = e.from.m.state === 'DONE';
            return (
              <path
                key={e.key}
                d={edgePath(x1, y1, x2, y2)}
                fill="none"
                stroke={live ? 'rgb(181 71 31)' : 'rgba(38,36,32,0.32)'}
                strokeWidth={live ? 1.6 : 1.1}
                strokeDasharray={live ? '0' : '4 4'}
                className="edge-draw"
                style={{ ['--dash' as string]: '600', animationDelay: `${i * 0.05}s` }}
              />
            );
          })}

          {layout.nodes.map((n, i) => (
            <GraphNode
              key={n.m.i}
              node={n}
              order={i}
              busy={busyIdx === n.m.i}
              canComplete={canComplete}
              onComplete={onComplete}
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[0.66rem] text-faint">
        <span className="inline-flex items-center gap-1.5">
          <Unlock size={11} className="text-rust" /> unlocked - ready to complete
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock size={11} /> locked - awaiting prerequisites
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check size={11} className="text-rust" /> done - keystone set
        </span>
      </div>
    </div>
  );
}

function GraphNode({
  node,
  order,
  busy,
  canComplete,
  onComplete,
}: {
  node: LaidNode;
  order: number;
  busy: boolean;
  canComplete: boolean;
  onComplete: (idx: number) => void;
}) {
  const m: Milestone = node.m;
  const isDone = m.state === 'DONE';
  const isUnlocked = m.state === 'UNLOCKED';
  const actionable = isUnlocked && canComplete && !busy;

  const stroke = isDone
    ? 'rgb(181 71 31)'
    : isUnlocked
      ? 'rgb(181 71 31)'
      : 'rgba(38,36,32,0.32)';
  const fill = isDone ? 'rgba(181,71,31,0.10)' : 'rgba(227,221,205,0.7)';

  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + order * 0.06, type: 'spring', stiffness: 240, damping: 24 }}
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: actionable ? 'pointer' : 'default' }}
      onClick={() => actionable && onComplete(m.i)}
      role={actionable ? 'button' : undefined}
      tabIndex={actionable ? 0 : undefined}
      aria-label={actionable ? `Complete milestone ${m.i + 1}: ${m.title}` : `${m.title} (${m.state})`}
      onKeyDown={(e) => {
        if (actionable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onComplete(m.i);
        }
      }}
    >
      <rect
        width={NODE_W}
        height={NODE_H}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={isUnlocked || isDone ? 1.6 : 1.1}
        strokeDasharray={m.state === 'LOCKED' ? '5 4' : '0'}
        className={isUnlocked && !busy ? 'node-live' : ''}
        style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
      />
      {/* index tab */}
      <text x={12} y={20} className="fill-faint" style={{ font: '600 10px var(--font-mono)' }}>
        M{m.i + 1}
      </text>
      {/* state glyph top-right */}
      <g transform={`translate(${NODE_W - 24}, 8)`}>
        {isDone ? (
          <Check x={0} y={0} size={14} color="rgb(181 71 31)" />
        ) : isUnlocked ? (
          <Unlock x={0} y={0} size={14} color="rgb(181 71 31)" />
        ) : (
          <Lock x={0} y={0} size={14} color="rgba(38,36,32,0.5)" />
        )}
      </g>
      <foreignObject x={10} y={26} width={NODE_W - 20} height={NODE_H - 32}>
        <div className="leading-tight">
          <div
            className="title-serif text-[0.78rem] text-ink"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {m.title}
          </div>
          {busy ? (
            <div className="mt-0.5 font-mono text-[0.6rem] text-rust">settling...</div>
          ) : actionable ? (
            <div className="mt-0.5 font-mono text-[0.6rem] text-rust">tap to set keystone</div>
          ) : null}
        </div>
      </foreignObject>
    </motion.g>
  );
}
