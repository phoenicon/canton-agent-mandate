#!/usr/bin/env python3
"""Payment adapter for the D1 spend-limited agent wallet.

This is a THIN layer. It does not decide anything about spending. Every
cap / allow-list / expiry / revocation decision is made by the Daml `Charge`
choice (see ../daml/Mandate.daml). This module only:

  1. asks Daml to authorise the scenario, by running the Demo script against a
     simulated in-memory ledger and reading back its audit report, and
  2. settles an authorised payment by reusing c8lab.transfer — the real Canton
     token-standard flow — never inventing its own transfer logic.

The one rule it enforces: it will not settle a payment that Daml did not
authorise. It cannot raise a cap or add a counterparty; only the ledger can.

Stdlib only, matching c8lab.py. No pip install.
"""
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

# --- locate the repo and the toolkit's c8lab.py -----------------------------

REPO = Path(__file__).resolve().parent.parent
DAR = REPO / ".daml" / "dist" / "canton-agent-mandate-0.1.0.dar"

# Reuse c8lab.py rather than duplicate token-standard logic. Default to the
# toolkit location; override with C8LAB=/path/to/c8lab.py.
C8LAB_PATH = Path(os.environ.get(
    "C8LAB", Path.home() / "hackathon-toolkit" / "c8lab.py"))


def load_c8lab():
    """Import c8lab.py from wherever the toolkit lives, without copying it."""
    if not C8LAB_PATH.exists():
        raise FileNotFoundError(
            f"c8lab.py not found at {C8LAB_PATH}. Set C8LAB to its path.")
    spec = importlib.util.spec_from_file_location("c8lab", C8LAB_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# --- step 1: the Daml authorisation, run on a simulated ledger --------------

def daml_authorise(static_time=True):
    """Run the Demo script on Daml's in-memory ledger and return its report.

    This runs the REAL `Charge` / `Revoke` choices. If the ledger ever wrongly
    authorised a charge, the Demo script's `submitMustFail` guards would make
    this call fail — so a returned report is proof the ledger did the enforcing.

    Returns the AuditReport as a dict. Requires the `daml` CLI on PATH and a
    built DAR (run `daml build` first).
    """
    if not DAR.exists():
        raise FileNotFoundError(
            f"DAR not built: {DAR}. Run `daml build` in {REPO} first.")
    out = REPO / ".daml" / "demo-report.json"
    cmd = ["daml", "script", "--ide-ledger", "--dar", str(DAR),
           "--script-name", "Demo:demo", "--output-file", str(out)]
    if static_time:
        cmd.append("--static-time")
    proc = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(
            "Daml authorisation run failed — the ledger did NOT behave as the "
            "mandate requires:\n" + proc.stderr[-1500:])
    return json.loads(out.read_text())


# --- step 2: settlement, reusing c8lab, gated by the Daml decision ----------

def settle(payment, sender, live=False, instrument="Amulet"):
    """Settle ONE authorised payment as a real Canton token-standard transfer.

    `payment` is one entry from the report's `authorisedPayments`, i.e. a
    payment the Daml mandate already authorised. This function never re-checks
    the cap or allow-list — that already happened, on the ledger.

    Without `live`, or with no reachable ledger, it returns a SIMULATED result
    and moves no value. It never reports a transfer that did not happen.
    """
    payTo, amount = payment["payTo"], payment["amount"]
    if not live:
        return {"status": "SIMULATED", "payTo": payTo, "amount": amount,
                "note": "value not moved; no live ledger this milestone"}
    # Live path: reuse c8lab's real two-phase token-standard transfer verbatim.
    c8 = load_c8lab()
    try:
        res = c8.transfer(sender, payTo, amount, instrument=instrument)
        return {"status": "TRANSFERRED", "payTo": payTo, "amount": amount,
                "transferKind": res.get("transferKind"),
                "instructionCid": res.get("instructionCid")}
    except Exception as e:  # c8lab.LabError or transport error — report honestly
        return {"status": "TRANSFER_FAILED", "payTo": payTo, "amount": amount,
                "error": str(e).split("\n")[0]}


def ledger_reachable():
    """True if a Canton ledger answers. Used only to caption the demo honestly."""
    try:
        c8 = load_c8lab()
        c8.ledger_end()
        return True
    except Exception:
        return False


if __name__ == "__main__":
    # Tiny self-check: print the Daml-sourced report as JSON.
    print(json.dumps(daml_authorise(), indent=2))
