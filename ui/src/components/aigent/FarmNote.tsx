import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  farmNoteHolding,
  farmNoteOffer,
  roles,
  type Role,
} from "@/lib/demo-data";
import { DemoTag, Field, Panel } from "./primitives";

export function FarmNote() {
  const [role, setRole] = useState<Role>("investor");
  const [accepted, setAccepted] = useState(false);
  const active = roles.find((r) => r.id === role)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Ledger party view"
          className="flex flex-wrap gap-1 rounded-lg border border-border bg-secondary/40 p-1"
        >
          {roles.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={role === r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm transition-colors",
                role === r.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-xs rounded-sm border border-border-strong px-2 py-0.5 text-[0.625rem]">
            {active.badge}
          </span>
          <p className="label-xs">Viewing as · {active.party}</p>
        </div>
      </div>

      {role === "outsider" ? (
        <Panel className="border-destructive/50 bg-destructive/5">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="label-xs text-destructive">Ledger response</span>
            <h3 className="text-2xl font-semibold text-destructive">
              No authorised view
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              This party is not a stakeholder in the contract.
            </p>
            <p className="mt-3 max-w-md font-mono text-xs text-muted-foreground">
              Canton sub-transaction privacy: no contract payload, no party
              names, no amounts are disclosed to non-stakeholders.
            </p>
            <p className="mt-2 max-w-md font-mono text-xs text-muted-foreground/80">
              Verified in Daml Script using per-party queryContractId visibility
              tests — contract test evidence, not a live frontend query.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-primary">
                  {accepted ? farmNoteHolding.template : farmNoteOffer.template}
                </span>
                <span
                  className={cn(
                    "label-xs rounded-sm px-2 py-0.5 text-[0.625rem]",
                    accepted
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning",
                  )}
                >
                  {accepted ? "Active holding" : "Pending acceptance"}
                </span>
              </div>
              <DemoTag />
            </div>

            {accepted ? (
              <div key="holding" className="animate-in fade-in duration-500">
                <Field k="Holder" v={farmNoteHolding.holder} />
                <Field k="Issuer" v={farmNoteHolding.issuer} />
                <Field k="Observer" v={farmNoteHolding.observer} />
                <Field k="Farm ID" v={farmNoteHolding.farmId} mono />
                <Field k="Units" v={farmNoteHolding.units} mono />
                <Field k="Notional" v={farmNoteHolding.notional} mono />
                <Field k="Status" v={farmNoteHolding.status} />
              </div>
            ) : (
              <div key="offer" className="animate-in fade-in duration-300">
                <Field k="Issuer" v={farmNoteOffer.issuer} />
                <Field k="Named investor" v={farmNoteOffer.investor} />
                <Field k="Observer" v={farmNoteOffer.observer} />
                <Field k="Farm ID" v={farmNoteOffer.farmId} mono />
                <Field k="Units" v={farmNoteOffer.units} mono />
                <Field k="Unit price" v={farmNoteOffer.unitPrice} mono />
                <Field k="Notional" v={farmNoteOffer.notional} mono />
              </div>
            )}
            <div className="mt-5 rounded-md border border-dashed border-border-strong bg-secondary/30 p-3">
              <p className="label-xs text-[0.625rem]">
                Illustrative commercial terms — not currently encoded in the
                Daml template
              </p>
              <div className="mt-2">
                <Field k="Tenor" v={farmNoteOffer.tenor} />
                <Field k="Coupon" v={farmNoteOffer.couponTarget} />
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col justify-between gap-6">
            <div>
              <p className="label-xs">Party capability</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {role === "investor" &&
                  "You are the named investor on this offer. Only you can exercise Accept."}
                {role === "spv" &&
                  "You issued this contract. You can see the offer and any resulting holding, but the acceptance choice belongs to the investor."}
                {role === "regulator" &&
                  "You are an observer on the contract. Full visibility, no transaction rights."}
              </p>
            </div>

            {role === "investor" && (
              <button
                onClick={() => setAccepted(true)}
                disabled={accepted}
                className={cn(
                  "w-full rounded-md px-4 py-3 text-sm font-semibold tracking-wide transition-all",
                  accepted
                    ? "cursor-default border border-success/40 bg-success/10 text-success"
                    : "bg-primary text-primary-foreground hover:brightness-110",
                )}
              >
                {accepted ? "FarmNote accepted" : "Accept FarmNote"}
              </button>
            )}

            {role === "spv" && (
              <p className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
                {accepted
                  ? "Offer archived → FarmNoteHolding created."
                  : "Awaiting investor exercise of Accept."}
              </p>
            )}

            {role === "regulator" && (
              <div className="rounded-md border border-accent/40 bg-accent/10 p-3">
                <p className="label-xs text-accent">Observe only</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No transaction actions are available to this party.
                </p>
              </div>
            )}

            {accepted && role !== "regulator" && (
              <button
                onClick={() => setAccepted(false)}
                className="text-left font-mono text-[0.7rem] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                reset demo state
              </button>
            )}
          </Panel>
        </div>
      )}
      <p className="font-mono text-xs text-muted-foreground">
        Cash settlement is not shown. Acceptance creates the holding contract
        only; Canton Token Standard settlement is a later integration layer.
      </p>
    </div>
  );
}
