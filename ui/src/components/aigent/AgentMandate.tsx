import { useState } from "react";
import { cn } from "@/lib/utils";
import { mandate, paymentAttempts, type AttemptResult } from "@/lib/demo-data";
import { DemoTag, Field, Panel } from "./primitives";

export function AgentMandate() {
  const [log, setLog] = useState<AttemptResult[]>([]);
  const [revoked, setRevoked] = useState(false);

  const run = (a: AttemptResult) => setLog((l) => [a, ...l].slice(0, 6));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="font-mono text-sm text-primary">{mandate.template}</span>
          <DemoTag />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-3 text-xs">
          <span className="font-medium">Owner</span>
          <span className="text-primary">→</span>
          <span className="font-medium">AI Farm Agent</span>
          <span className="text-primary">→</span>
          <span className="font-medium">Approved Supplier</span>
        </div>

        <Field k="Owner" v={mandate.owner} />
        <Field k="Agent" v={mandate.agent} />
        <Field k="Maximum transaction" v={mandate.cap} mono />
        <Field k="Approved supplier" v={mandate.approvedCounterparties.join(", ")} />
        <Field k="Expiry" v={mandate.expiry} mono />
        <Field
          k="Status"
          v={
            <span className={revoked ? "text-destructive" : "text-success"}>
              {revoked ? "Revoked by owner" : "Active · revocable by owner"}
            </span>
          }
        />

        <button
          onClick={() => setRevoked((r) => !r)}
          className="mt-4 w-full rounded-md border border-border-strong px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {revoked ? "Reinstate mandate" : "Revoke mandate (owner)"}
        </button>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <p className="label-xs mb-3">Agent payment attempts</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {paymentAttempts.map((a) => (
              <button
                key={a.id}
                onClick={() =>
                  run(
                    revoked
                      ? {
                          ...a,
                          outcome: "rejected",
                          headline: "REJECTED BY CONTRACT RULE",
                          reason: "mandate revoked",
                          detail: "The owner has revoked this agent mandate.",
                          rule: "mandate archived by owner",
                        }
                      : a,
                  )
                }
                className="rounded-md border border-border bg-secondary/40 px-3 py-3 text-left text-sm transition-colors hover:border-border-strong hover:bg-secondary"
              >
                {a.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="min-h-40">
          <p className="label-xs mb-3">Ledger outcome</p>
          {log.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Run an attempt to see how the mandate rules resolve.
            </p>
          ) : (
            <ul className="space-y-2">
              {log.map((r, i) => (
                <li
                  key={`${r.id}-${i}`}
                  className={cn(
                    "animate-in fade-in slide-in-from-top-1 rounded-md border-l-2 p-3 duration-300",
                    r.outcome === "permitted"
                      ? "border-l-success bg-success/10"
                      : "border-l-destructive bg-destructive/10",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold tracking-wider",
                        r.outcome === "permitted"
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      {r.outcome === "permitted" ? "✓ " : "✕ "}
                      {r.headline}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.amount} → {r.counterparty}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      r.outcome === "permitted"
                        ? "text-success"
                        : "text-destructive",
                    )}
                  >
                    {r.reason}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                  <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground/80">
                    {r.rule}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
