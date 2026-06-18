'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Continue',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-[min(94vw,440px)] bg-paper p-6"
            style={{ border: '1px solid var(--hairline-strong)' }}
          >
            <div className="tick-label mb-2">Drafting confirmation</div>
            <h3 className="title-serif mb-2 text-lg text-ink">{title}</h3>
            <p className="mb-5 text-[0.88rem] leading-relaxed text-graphite">{body}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost px-4 py-2" onClick={onCancel}>
                Cancel
              </button>
              <button className="btn-rust px-4 py-2" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
