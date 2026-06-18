'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'ok' | 'warn' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  push: (kind: ToastKind, text: string) => void;
}

const Ctx = createContext<ToastApi>({ push: () => {} });

export function useToast(): ToastApi {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="paper-card flex items-start gap-2 px-3 py-2.5 shadow-sm"
            >
              <span className="mt-0.5 shrink-0">
                {t.kind === 'ok' ? (
                  <Check size={15} className="text-rust" />
                ) : t.kind === 'warn' ? (
                  <AlertTriangle size={15} className="text-rust" />
                ) : (
                  <Info size={15} className="text-graphite" />
                )}
              </span>
              <span className="flex-1 text-[0.82rem] leading-snug text-ink">{t.text}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notice"
                className="shrink-0 text-faint hover:text-ink"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
