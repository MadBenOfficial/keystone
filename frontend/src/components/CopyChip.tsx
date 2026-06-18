'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export function CopyChip({ value, label, className = '' }: Props) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be blocked */
    }
  };
  return (
    <button
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-graphite hover:text-rust ${className}`}
      aria-label={`Copy ${label ?? value}`}
      title="Copy to clipboard"
    >
      <span>{label ?? value}</span>
      {copied ? <Check size={12} className="text-rust" /> : <Copy size={12} />}
    </button>
  );
}
