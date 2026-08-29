import { createFileRoute } from "@tanstack/react-router";
import { AgentMandate } from "@/components/aigent/AgentMandate";
import { FarmNote } from "@/components/aigent/FarmNote";
import { DemoTag, Panel, Section } from "@/components/aigent/primitives";
import { evidence, farm } from "@/lib/demo-data";

const title = "AIGENT.FARM — Canton Settlement Spine";
const description =
  "Private farm capital and bounded AI authority: FarmNote issuance, per-party privacy and agent mandate enforcement demonstrated on a Canton/Daml contract layer.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="field-glow min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <header className="border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
                AIGENT<span className="text-primary">.</span>FARM
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
                Private farm capital. Bounded AI authority. Enforced by Canton.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <p className="label-xs text-success">
                CANTOR8 DEVNET · LEDGER CONNECTED
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Asset", farm.name],
              ["Farm ID", farm.farmId],
              ["Investment", farm.investment],
              ["Units", farm.units],
              ["Unit price", farm.unitPrice],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-3">
                <p className="label-xs">{k}</p>
                <p className="mt-1 font-mono text-sm">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {farm.location} · {farm.use} · fictional example for demonstration
          </p>
        </header>

        <div className="space-y-12 pt-10">
          <Section
            index="01"
            title="FarmNote"
            subtitle="Private issuance to a named investor, with per-party visibility"
          >
            <FarmNote />
          </Section>

          <Section
            index="02"
            title="Agent Mandate"
            subtitle="Strictly bounded delegated authority for an AI agent"
          >
            <AgentMandate />
          </Section>

          <Section
            index="03"
            title="Contract evidence"
            badge="12 / 12 DAML SCRIPTS GREEN"
          >
            <Panel>
              <ul className="grid gap-2 sm:grid-cols-2">
                {evidence.map((e) => (
                  <li key={e.label} className="flex items-start gap-3 py-1">
                    <span className="mt-0.5 font-mono text-xs text-success">✓</span>
                    <span className="text-sm">
                      {e.label}
                      <span className="label-xs ml-2">{e.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Contract-layer results come from the Daml test suite. Everything
                rendered on this screen is <DemoTag /> state served from a single
                local mock module.
              </p>
            </Panel>
          </Section>

          <footer className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold tracking-tight">
              What is real today
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The FarmNote and Agent Mandate Daml contracts are implemented and
              adversarially tested. Per-party contract visibility is tested from
              independent ledger views. Cantor8 DevNet authentication and ledger
              connectivity are working. The frontend visualises those workflows.
              Canton Token Standard settlement is a separate next integration
              layer.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground/80">
              No FarmNote cash settlement, atomic Canton Coin transfer, or
              on-ledger transaction hash is claimed by this demo UI.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
