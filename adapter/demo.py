#!/usr/bin/env python3
"""Judge-facing terminal demo for D1: a spend-limited wallet for an AI agent.

    python3 adapter/demo.py            # settlement simulated (no ledger needed)
    python3 adapter/demo.py --live     # settle via real c8lab token transfers

It runs the whole scenario through the REAL Daml mandate on a simulated ledger
(cap, allow-list, expiry, revocation all enforced there — not here), then prints
the audit statement from the ledger's own numbers, then settles each authorised
payment by reusing c8lab's token-standard transfer.

Nothing in this file decides whether a charge is allowed. That is the point.
"""
import sys

import agent_wallet as aw


def money(x):
    return f"{float(x):.2f}"


def main():
    live = "--live" in sys.argv[1:]

    print("Running the mandate scenario through Daml (in-memory ledger)…\n")
    report = aw.daml_authorise()

    # --- the required statement, every figure sourced from the ledger --------
    print("AGENT MANDATE AUDIT")
    print(f"Budget granted:            {money(report['budgetGranted'])} Amulet")
    print(f"Successfully spent:        {money(report['successfullySpent'])} Amulet")
    print(f"Remaining:                 {money(report['remaining'])} Amulet")
    print(f"Valid charges:             {report['validCharges']}")
    print(f"Rejected by cap:           {report['rejectedByCap']}")
    print(f"Rejected by counterparty:  {report['rejectedByCounterparty']}")
    print(f"Rejected after revocation: {report['rejectedAfterRevocation']}")
    print(f"Ledger enforced:           {'YES' if report['ledgerEnforced'] else 'NO'}")

    # --- settlement: reuse c8lab, only for charges the ledger authorised ------
    reachable = aw.ledger_reachable()
    mode = ("LIVE" if live and reachable
            else "LIVE (requested, but no ledger reachable)" if live
            else "SIMULATED")
    print(f"\nSettlement ({mode}) — one Canton Coin transfer per authorised charge:")
    sender = report["owner"]  # the owner funds every payment; the agent never can
    for p in report["authorisedPayments"]:
        r = aw.settle(p, sender, live=live and reachable)
        line = f"  {money(r['amount'])} Amulet -> {r['payTo']}  [{r['status']}]"
        if r.get("transferKind"):
            line += f" kind={r['transferKind']}"
        if r.get("error"):
            line += f"  ({r['error']})"
        if r.get("note"):
            line += f"  ({r['note']})"
        print(line)

    if mode != "LIVE":
        print("\nNOTE: value movement is SIMULATED this milestone — no live ledger.")
        print("      The cap/allow-list/expiry/revocation checks above are REAL,")
        print("      enforced by Daml. Only the coin transfer is not yet executed.")


if __name__ == "__main__":
    main()
