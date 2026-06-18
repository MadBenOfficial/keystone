'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import { EXPLORER, CONTRACT_ADDRESS } from '@/lib/contract';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: String((error as { message?: string })?.message ?? error) };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const notFound = /not found|reverted/i.test(this.state.message);
    return (
      <div className="mx-auto my-20 w-[min(92vw,560px)] bg-paper p-7" style={{ border: '1px solid var(--hairline-strong)' }}>
        <div className="tick-label mb-2">Drawing interrupted</div>
        <h2 className="title-serif mb-2 text-xl text-ink">The board could not be rendered</h2>
        <p className="mb-4 text-[0.88rem] leading-relaxed text-graphite">
          {notFound
            ? 'The contract did not answer at this address. It may still be propagating across nodes, or the wired address is stale. The diagnostic below is exact.'
            : 'Something broke while reading the chain. This is usually transient.'}
        </p>
        <pre className="mb-5 overflow-x-auto bg-paper2 p-3 font-mono text-[0.72rem] text-graphite" style={{ border: '1px solid var(--hairline)' }}>
          {this.state.message.slice(0, 360)}
        </pre>
        <div className="flex flex-wrap gap-2">
          <button className="btn-rust px-4 py-2" onClick={() => this.setState({ hasError: false, message: '' })}>
            <span className="inline-flex items-center gap-1.5">
              <RotateCw size={13} /> Retry
            </span>
          </button>
          <a
            className="btn-ghost px-4 py-2"
            href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in explorer
          </a>
        </div>
      </div>
    );
  }
}
