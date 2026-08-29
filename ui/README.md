# Canton Agent Mandate — frontend

The *AIGENT.FARM* demo UI. Visualises the Daml workflows: the Agent Mandate
(primary) and the FarmNote privacy extension. Mock state lives in
`src/lib/demo-data.ts`. This UI does **not** claim live FarmNote settlement.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (Vite + Nitro)
```

Node 20 / 22 / 24 recommended. Authored with Bun (`bun.lock` kept); `npm` works
and is what the build is verified with.

## Stack

TanStack Start · React 19 · TypeScript · Tailwind 4

See the [root README](../README.md) for the project story and
[ARCHITECTURE.md](../ARCHITECTURE.md) for how the UI relates to the Daml layer.
