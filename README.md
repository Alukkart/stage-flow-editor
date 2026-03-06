# Stage Flow Editor

Visual node editor for building AI pipeline graphs with flow + data connections, auto-layout, and JSON import/export.

## Demo

Live demo: https://stage-flow-editor.vercel.app/

## What it does

- Build pipelines as a graph of connected nodes.
- Distinguish flow edges (execution order) and data edges (variables).
- Support dynamic handles for node fields (arguments, outputs, artifacts, branches).
- Import/export pipeline JSON.
- Auto-layout graph using Dagre (draft-like behavior).
- Persist editor state to `localStorage`.

## Supported node types

- `inputsNode` - pipeline inputs and variable producers.
- `stageNode` - server stage with dynamic args/config/outputs.
- `parallelNode` - fan-out children with `all` / `any` policy.
- `conditionNode` - branch by JSON logic (`then` / `else`).
- `terminalNode` - final result + artifacts sink.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- `@xyflow/react` (React Flow)
- Zustand (graph state)
- Dagre (auto-layout)
- shadcn/ui + Radix UI

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional, for remote stage catalog)

```bash
NEXT_PUBLIC_STAGES_URL=https://your-server/stages.json
```

If `NEXT_PUBLIC_STAGES_URL` is set, the editor loads server stages into the catalog.

### 3. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` - start dev server (webpack mode).
- `npm run dev:turbo` - start dev server with Turbopack.
- `npm run build` - production build.
- `npm run start` - run production server.
- `npm run lint` - ESLint checks.

## Import/Export format

- Import expects a pipeline JSON (`api_version`, `entry`, `nodes`).
- Export generates pipeline JSON from current graph.
- During import, graph is automatically laid out.