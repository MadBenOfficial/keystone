'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/components/Toasts';
import { TitleBlock } from '@/components/TitleBlock';
import { GraphBoard } from '@/components/GraphBoard';
import { ObjectiveComposer } from '@/components/ObjectiveComposer';
import { GoalsVault } from '@/components/GoalsVault';
import { HowItWorks } from '@/components/HowItWorks';
import { ConsensusOverlay } from '@/components/ConsensusOverlay';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  fetchGoals,
  fetchStats,
  forgeGoal,
  chartGoal,
  completeMilestone,
  makeWalletClient,
  pollUntilDecided,
  friendlyError,
  IS_DEPLOYED,
  EXPLORER,
  type Goal,
  type Stats,
  type LeaderDraft,
} from '@/lib/contract';

type Phase = 'forge' | 'chart' | 'complete';
interface Pending {
  phase: Phase;
  title: string;
  body: string;
  run: () => Promise<void>;
}

const POLL_MS = 90_000;

export default function Page() {
  const wallet = useWallet();
  const toast = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<Stats>({ goals: 0, achieved: 0 });
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [overlay, setOverlay] = useState<{
    open: boolean;
    phase: Phase;
    status: string;
    draft: LeaderDraft | null;
    txHash: string | null;
    label: string;
  }>({ open: false, phase: 'chart', status: 'WALLET', draft: null, txHash: null, label: '' });

  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const busyRef = useRef(false);

  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeId) ?? null,
    [goals, activeId],
  );

  // Derive stats client-side from the page of goals plus the on-chain counters.
  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    try {
      const [gs, st] = await Promise.all([fetchGoals(0), fetchStats()]);
      setGoals(gs);
      setStats(st);
      setActiveId((prev) => {
        if (prev && gs.some((g) => g.id === prev)) return prev;
        const firstCharted = gs.find((g) => g.milestones.length > 0);
        return firstCharted?.id ?? gs[0]?.id ?? null;
      });
    } catch (e) {
      // surfaced by the error boundary only on first paint; polling stays quiet
      if (loading) throw e;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!IS_DEPLOYED) {
      setLoading(false);
      return;
    }
    refresh();
    const id = setInterval(() => {
      if (!busyRef.current) refresh();
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guard = useCallback((): boolean => {
    if (!wallet.address) {
      toast.push('info', 'Connect your wallet to draft on Bradbury.');
      return false;
    }
    if (!wallet.onChain) {
      toast.push('warn', 'Switch to the Bradbury testnet to continue.');
      return false;
    }
    return true;
  }, [wallet.address, wallet.onChain, toast]);

  const setBusyState = (b: boolean) => {
    busyRef.current = b;
    setBusy(b);
  };

  const runWrite = useCallback(
    async (
      phase: Phase,
      label: string,
      submit: () => Promise<`0x${string}`>,
      onDone: (status: string) => void,
    ) => {
      setBusyState(true);
      setOverlay({ open: true, phase, status: 'WALLET', draft: null, txHash: null, label });
      try {
        const hash = await submit();
        setOverlay((o) => ({ ...o, status: 'SUBMITTED', txHash: hash }));
        toast.push('info', 'Transaction submitted. Following consensus.');
        const wc = makeWalletClient(wallet.address as `0x${string}`);
        const { status } = await pollUntilDecided(wc, hash, (status, draft) => {
          setOverlay((o) => ({ ...o, status, draft: draft ?? o.draft }));
        });
        onDone(status);
      } catch (e) {
        toast.push('warn', friendlyError(e));
      } finally {
        setOverlay((o) => ({ ...o, open: false }));
        setBusyState(false);
        setBusyIdx(null);
        await refresh();
      }
    },
    [wallet.address, toast, refresh],
  );

  const doForge = useCallback(
    (title: string, objective: string) => {
      if (!guard()) return;
      setPending({
        phase: 'forge',
        title: 'Forge this goal',
        body: 'This submits a transaction on Bradbury Testnet. Network fees apply. Continue?',
        run: async () => {
          const client = makeWalletClient(wallet.address as `0x${string}`);
          await runWrite(
            'forge',
            'Filing the goal',
            () => forgeGoal(client, title, objective) as Promise<`0x${string}`>,
            (status) => {
              if (status === 'ACCEPTED' || status === 'FINALIZED')
                toast.push('ok', 'Goal forged. Chart it to draw the graph.');
              else toast.push('warn', `Settled as ${status}.`);
            },
          );
        },
      });
    },
    [guard, wallet.address, runWrite, toast],
  );

  const doChart = useCallback(
    (g: Goal) => {
      if (!guard()) return;
      setActiveId(g.id);
      setPending({
        phase: 'chart',
        title: `Chart "${g.title}"`,
        body: 'The Strategist will decompose this objective under validator consensus. This submits a transaction on Bradbury Testnet. Network fees apply. Continue?',
        run: async () => {
          const client = makeWalletClient(wallet.address as `0x${string}`);
          await runWrite(
            'chart',
            'Strategist drafting the graph',
            () => chartGoal(client, g.id) as Promise<`0x${string}`>,
            (status) => {
              if (status === 'ACCEPTED' || status === 'FINALIZED')
                toast.push('ok', 'Graph charted and settled on-chain.');
              else toast.push('warn', `Settled as ${status}.`);
            },
          );
        },
      });
    },
    [guard, wallet.address, runWrite, toast],
  );

  const doComplete = useCallback(
    (idx: number) => {
      if (!guard() || !activeGoal) return;
      const m = activeGoal.milestones.find((x) => x.i === idx);
      setPending({
        phase: 'complete',
        title: `Set keystone M${idx + 1}`,
        body: `Mark "${m?.title ?? 'this milestone'}" as done. This submits a transaction on Bradbury Testnet. Network fees apply. Continue?`,
        run: async () => {
          const client = makeWalletClient(wallet.address as `0x${string}`);
          setBusyIdx(idx);
          await runWrite(
            'complete',
            'Setting the keystone',
            () => completeMilestone(client, activeGoal.id, idx) as Promise<`0x${string}`>,
            (status) => {
              if (status === 'ACCEPTED' || status === 'FINALIZED')
                toast.push('ok', 'Keystone set. Dependents may have unlocked.');
              else toast.push('warn', `Settled as ${status}.`);
            },
          );
        },
      });
    },
    [guard, activeGoal, wallet.address, runWrite, toast],
  );

  const confirmRun = useCallback(async () => {
    const p = pending;
    setPending(null);
    if (p) await p.run();
  }, [pending]);

  const canComplete = !!wallet.address && wallet.onChain && !busy;

  return (
    <ErrorBoundary>
      <main className="relative min-h-screen px-4 pb-44 pt-6 sm:px-8 lg:px-14">
        {/* floating active-goal marker, top-left like a drawing annotation */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 max-w-xl"
        >
          <div className="tick-label">Active drawing</div>
          <h1 className="title-serif text-2xl leading-tight text-ink sm:text-3xl">
            {activeGoal ? activeGoal.title : 'keystone'}
          </h1>
          <p className="mt-1 font-mono text-[0.7rem] text-faint">
            {stats.goals} goals filed / {stats.achieved} achieved / an AI dependency planner on GenLayer
          </p>
        </motion.div>

        {!IS_DEPLOYED && (
          <div
            className="mb-6 flex items-start gap-2 bg-paper2/70 p-3 font-mono text-[0.74rem] text-graphite"
            style={{ border: '1px solid var(--hairline-strong)' }}
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rust" />
            <span>
              The contract address is not wired yet. Reads are paused until a deployed address is set
              in the build.
            </span>
          </div>
        )}

        {/* hero: the live dependency board */}
        <section
          className="mb-8 min-h-[460px] bg-paper2/40 p-5"
          style={{ border: '1px solid var(--hairline-strong)' }}
        >
          <GraphBoard
            goal={activeGoal}
            busyIdx={busyIdx}
            canComplete={canComplete}
            onComplete={doComplete}
          />
        </section>

        <div className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ObjectiveComposer disabled={busy} onForge={doForge} />
          <GoalsVault
            goals={goals}
            loading={loading}
            activeId={activeId}
            busy={busy}
            onOpen={(g) => setActiveId(g.id)}
            onChart={doChart}
          />
        </div>

        <div className="mb-8">
          <HowItWorks />
        </div>

        {/* single drafting-baseline footer strip */}
        <footer
          className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 font-mono text-[0.66rem] text-faint"
          style={{ borderColor: 'var(--hairline-strong)' }}
        >
          <span>keystone / drafted on GenLayer Bradbury Testnet</span>
          <a href={EXPLORER} target="_blank" rel="noreferrer" className="hover:text-rust">
            explorer-bradbury.genlayer.com
          </a>
        </footer>

        <TitleBlock wallet={wallet} />

        <ConsensusOverlay
          open={overlay.open}
          phase={overlay.phase}
          status={overlay.status}
          draft={overlay.draft}
          txHash={overlay.txHash}
          label={overlay.label}
        />

        <ConfirmDialog
          open={!!pending}
          title={pending?.title ?? ''}
          body={pending?.body ?? ''}
          confirmLabel="Sign and submit"
          onConfirm={confirmRun}
          onCancel={() => setPending(null)}
        />
      </main>
    </ErrorBoundary>
  );
}
