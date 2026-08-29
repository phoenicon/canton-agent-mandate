import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { settlement, type AttemptResult } from "@/lib/demo-data";
import { Panel } from "./primitives";

// Compact live-settlement panel. Mirrors the mandate decision:
//   permitted  -> AUTHORIZED -> SETTLING -> CONFIRMED (real 1 CC proof)
//   rejected   -> BLOCKED (settlement NOT invoked, balance unchanged)
// Deterministic and network-free so the demo cannot break; the real DevNet
// transfer is operator-run and its verified before/after are shown here.

type Phase = "idle" | "authorized" | "settling" | "confirmed" | "blocked";

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "bad" | "warn" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="label-xs">{k}</span>
      <span
        className={cn(
          "font-mono text-xs",
          tone === "ok" && "text-success",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-warning",
          !tone && "text-foreground",
        )}
      >
        {v}
      </span>
    </div>
  );
}

export function LiveSettlement({ latest }: { latest: AttemptResult | null }) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (!latest) {
      setPhase("idle");
      return;
    }
    if (latest.outcome === "rejected") {
      setPhase("blocked");
      return;
    }
    // permitted: brief authorized -> settling -> confirmed
    setPhase("authorized");
    const t1 = setTimeout(() => setPhase("settling"), 450);
    const t2 = setTimeout(() => setPhase("confirmed"), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [latest]);

  const banner: Record<Phase, { label: string; tone: string }> = {
    idle: { label: "IDLE", tone: "text-muted-foreground" },
    authorized: { label: "AUTHORIZED", tone: "text-success" },
    settling: { label: "SETTLING…", tone: "text-warning" },
    confirmed: { label: "OFFER CREATED", tone: "text-success" },
    blocked: { label: "BLOCKED", tone: "text-destructive" },
  };

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="label-xs">Live Canton settlement</p>
        <span className={cn("font-mono text-xs font-semibold tracking-wider", banner[phase].tone)}>
          {banner[phase].label}
        </span>
      </div>

      {phase === "idle" && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No settlement attempted. Run a payment to see the mandate gate it.
        </p>
      )}

      {(phase === "authorized" || phase === "settling") && latest && (
        <div>
          <Row k="Mandate decision" v="PERMITTED" tone="ok" />
          <Row k="Sender" v={settlement.sender} />
          <Row k="Commercial request" v={`${latest.amount} → ${latest.counterparty}`} />
          <Row k="Settlement proof" v={settlement.proofCC} />
          <p className="mt-2 font-mono text-xs text-warning">
            {phase === "authorized"
              ? "Mandate passed. Settlement ready."
              : "Submitting Canton Token Standard transfer…"}
          </p>
        </div>
      )}

      {phase === "confirmed" && latest && (
        <div>
          <Row k="Mandate decision" v="PERMITTED" tone="ok" />
          <Row k="Sender" v={settlement.sender} />
          <Row k="Commercial request" v={`${latest.amount} → ${latest.counterparty}`} />
          <Row k="Settlement proof" v={settlement.proofCC} />
          <Row k="Before" v={settlement.before} />
          <Row k="Spendable after" v={settlement.spendableAfter} tone="ok" />
          <Row k="Locked in offer" v={settlement.lockedInOffer} tone="warn" />
          <Row k="transferKind" v={settlement.transferKind} tone="warn" />
          <Row k="Instruction CID" v={settlement.instructionCid} />
          <Row k="Status" v="OFFER CREATED" tone="ok" />
          <p className="mt-2 font-mono text-[0.7rem] text-warning">
            Receiver acceptance pending — no final settlement claimed.
          </p>
          <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground/80">
            £ commercial amount ≠ CC settlement amount. Real {settlement.instrument} on {settlement.network}.
          </p>
        </div>
      )}

      {phase === "blocked" && latest && (
        <div>
          <Row k="Mandate decision" v="REJECTED" tone="bad" />
          <Row k="Reason" v={latest.reason.toUpperCase()} tone="bad" />
          <Row k="Settlement" v="NOT INVOKED" tone="bad" />
          <Row k="CC balance" v="UNCHANGED" />
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground/80">
            Rejected by Daml before any transfer. No settlement call was made.
          </p>
        </div>
      )}
    </Panel>
  );
}
