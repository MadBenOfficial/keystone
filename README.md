# keystone

An objective is rarely one task. It is a structure: things that can start now,
and things that cannot begin until something else is finished. keystone is an
AI dependency planner that draws that structure on-chain.

You state an objective. A Strategist model reads it and decomposes it into a
graph of milestones joined by prerequisite edges, then settles a single
feasibility reading under validator consensus. Root milestones unlock first.
Completing a prerequisite cascades unlocks down the graph until every node is
set and the goal is achieved. The whole plan lives on GenLayer Bradbury, not in
a database.

## Why this needs consensus

A plan that an AI invents privately is just an opinion. keystone puts the one
subjective judgment that matters - how feasible the objective is - in front of
multiple validators who each re-run the Strategist and must independently agree
within a tolerance band before the chart is committed. The milestone wording is
leader flavor; the feasibility reading is the consensus anchor.

Everything that can be deterministic, is. The graph that gets stored is repaired
by a backstop that keeps only edges pointing strictly backward in milestone
order, so a cycle is impossible by construction. Unlock cascades and the final
achieved transition run with no AI at all - pure, reproducible state.

## The three moves

A goal travels through three on-chain writes:

1. `forge_goal(title, objective)` records the goal in PLANNING status. Deterministic, no model.
2. `chart(goal_id)` runs the Strategist under consensus and stores a DAG of four
   to eight milestones with a clamped feasibility score. Status becomes ACTIVE.
3. `complete(goal_id, idx)` marks an unlocked milestone DONE and cascades unlocks
   to dependents whose prerequisites are now satisfied. When all are DONE the
   goal is ACHIEVED.

Reads are paged newest-first through `get_goals`, `get_goal`, and `get_stats`.

## Running the frontend

The interface is a Next.js static export. The dependency board is the hero: it
is the live DAG, drawn on warm drafting paper, with milestone nodes and
prerequisite connectors rather than a card grid.

```
cd frontend
npm install
npm run dev      # local drafting table
npm run build    # static export into out/
```

Connect a GenLayer-compatible wallet, switch to Bradbury, and claim testnet GEN
from the faucet before charting - the Strategist write costs network fees.

## Contract surface

The intelligent contract is a single pinned-runner Python module under
`contracts/`. Validation is two-staged: `genvm-lint` for static safety, then a
real StudioNet integration test that forges a goal, charts it, asserts a valid
DAG with at least one unlocked root, and completes a root milestone.

```
genvm-lint lint contracts/contract.py --json
gltest tests/integration/ -v -s --network studionet \
  --default-wait-interval 5000 --default-wait-retries 120
```

## Coordinates

```ini
project   = keystone
role      = AI dependency planner (objective -> milestone DAG)
chain     = GenLayer Bradbury Testnet (chainId 0x107D)
live      = https://madbenofficial.github.io/keystone/
contract  = 0x93b0a97f0F78B1e834474D4088F35C2fa455Db2D
explorer  = https://explorer-bradbury.genlayer.com
faucet    = https://testnet-faucet.genlayer.foundation/
source    = contracts/contract.py
frontend  = Next.js App Router static export
```
