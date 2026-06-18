import type { Milestone } from '@/lib/contract';

export interface LaidNode {
  m: Milestone;
  depth: number;
  row: number;
  x: number;
  y: number;
}

export interface LaidEdge {
  from: LaidNode;
  to: LaidNode;
  key: string;
}

export interface GraphLayout {
  nodes: LaidNode[];
  edges: LaidEdge[];
  width: number;
  height: number;
  cols: number;
  rows: number;
}

export const NODE_W = 188;
export const NODE_H = 84;
const COL_GAP = 96; // horizontal space between columns
const ROW_GAP = 34; // vertical space between rows
const PAD = 36;

// Compute a layered DAG layout. Depth is the longest prerequisite chain to a
// root, so prerequisites always sit strictly to the left of their dependents -
// the drawing reads left to right exactly like a build plan.
export function layoutGraph(milestones: Milestone[]): GraphLayout {
  const byIndex = new Map<number, Milestone>();
  for (const m of milestones) byIndex.set(m.i, m);

  const depthMemo = new Map<number, number>();
  const depthOf = (i: number, guard = 0): number => {
    if (depthMemo.has(i)) return depthMemo.get(i)!;
    if (guard > 64) return 0; // defensive; contract guarantees acyclic
    const m = byIndex.get(i);
    if (!m || m.prereqs.length === 0) {
      depthMemo.set(i, 0);
      return 0;
    }
    let d = 0;
    for (const p of m.prereqs) d = Math.max(d, depthOf(p, guard + 1) + 1);
    depthMemo.set(i, d);
    return d;
  };

  const sorted = [...milestones].sort((a, b) => a.i - b.i);
  const columns = new Map<number, LaidNode[]>();
  const nodes: LaidNode[] = [];

  for (const m of sorted) {
    const depth = depthOf(m.i);
    const col = columns.get(depth) ?? [];
    const node: LaidNode = { m, depth, row: col.length, x: 0, y: 0 };
    col.push(node);
    columns.set(depth, col);
    nodes.push(node);
  }

  const cols = Math.max(1, ...Array.from(columns.keys()).map((k) => k + 1));
  let rows = 1;
  for (const list of columns.values()) rows = Math.max(rows, list.length);

  for (const node of nodes) {
    const colList = columns.get(node.depth)!;
    // center each column vertically within the tallest column
    const colHeight = colList.length * NODE_H + (colList.length - 1) * ROW_GAP;
    const fullHeight = rows * NODE_H + (rows - 1) * ROW_GAP;
    const offset = (fullHeight - colHeight) / 2;
    node.x = PAD + node.depth * (NODE_W + COL_GAP);
    node.y = PAD + offset + node.row * (NODE_H + ROW_GAP);
  }

  const nodeByIndex = new Map<number, LaidNode>();
  for (const n of nodes) nodeByIndex.set(n.m.i, n);

  const edges: LaidEdge[] = [];
  for (const n of nodes) {
    for (const p of n.m.prereqs) {
      const from = nodeByIndex.get(p);
      if (from) edges.push({ from, to: n, key: `${p}->${n.m.i}` });
    }
  }

  const width = PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP;
  const height = PAD * 2 + rows * NODE_H + (rows - 1) * ROW_GAP;

  return { nodes, edges, width, height, cols, rows };
}
