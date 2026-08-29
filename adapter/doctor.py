#!/usr/bin/env python3
"""DevNet preflight for canton-agent-mandate.

    python3 adapter/doctor.py

Confirms the four things that break a DevNet run before you waste a token on it:
  1. Daml SDK 3.4.10 is the project SDK (we do not upgrade).
  2. c8lab.py is where we expect it (reused in place, never vendored).
  3. The required DevNet env vars are set.
  4. `c8lab check` reaches the ledger, lists parties and balances.

Read-only. It sets nothing and commits nothing. Secrets are masked in output.
Exit code is 0 only when everything needed for DevNet is green.
"""
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
REQUIRED_SDK = "3.4.10"
C8LAB_PATH = Path(os.environ.get(
    "C8LAB", Path.home() / "hackathon-toolkit" / "c8lab.py"))

# C8_CLIENT_ID has a sane default in c8lab; the rest must be supplied for DevNet.
REQUIRED_ENV = ["C8_BASE", "C8_IDP", "C8_CLIENT_ID", "C8_CLIENT_SECRET",
                "C8_REGISTRY"]
SECRETS = {"C8_CLIENT_SECRET"}

ok_count = 0
fail_count = 0


def line(status, label, detail=""):
    global ok_count, fail_count
    mark = {"PASS": "  ok  ", "FAIL": " FAIL ", "WARN": " warn ",
            "INFO": "      "}[status]
    if status == "PASS":
        ok_count += 1
    elif status == "FAIL":
        fail_count += 1
    print(f"  [{mark}] {label}" + (f"  {detail}" if detail else ""))


def mask(value):
    if len(value) <= 4:
        return "*" * len(value)
    return value[:2] + "*" * (len(value) - 4) + value[-2:]


# --- 1. Daml SDK ------------------------------------------------------------
print("\n[1] Daml SDK")
try:
    out = subprocess.run(["daml", "version"], cwd=str(REPO),
                         capture_output=True, text=True, timeout=120).stdout
    project_line = next((ln for ln in out.splitlines()
                         if "project SDK version" in ln), "")
    if REQUIRED_SDK in project_line:
        line("PASS", f"project SDK is {REQUIRED_SDK}", "(pinned in daml.yaml)")
    elif REQUIRED_SDK in out:
        line("WARN", f"{REQUIRED_SDK} installed but not the project SDK",
             project_line.strip())
    else:
        line("FAIL", f"Daml {REQUIRED_SDK} not found", "run: daml install 3.4.10")
except FileNotFoundError:
    line("FAIL", "daml CLI not on PATH",
         "export PATH=\"$HOME/.daml/bin:$PATH\"")
except Exception as e:
    line("FAIL", "could not run `daml version`", str(e).split(chr(10))[0])


# --- 2. c8lab.py ------------------------------------------------------------
print("\n[2] c8lab.py (external, reused in place)")
if C8LAB_PATH.exists():
    line("PASS", "found", str(C8LAB_PATH))
else:
    line("FAIL", "not found", f"{C8LAB_PATH} — set C8LAB to its path")


# --- 3. DevNet env vars -----------------------------------------------------
print("\n[3] DevNet environment")
for key in REQUIRED_ENV:
    val = os.environ.get(key, "")
    if not val:
        line("FAIL", key, "not set — see .env.example")
    else:
        shown = mask(val) if key in SECRETS else val
        line("PASS", key, shown)
c8lab_env = os.environ.get("C8LAB")
line("INFO", "C8LAB", c8lab_env if c8lab_env else "(default ~/hackathon-toolkit)")


# --- 4. c8lab check ---------------------------------------------------------
print("\n[4] c8lab check (ledger, parties, balances)")
missing_core = [k for k in ("C8_BASE", "C8_IDP", "C8_CLIENT_SECRET")
                if not os.environ.get(k)]
if missing_core:
    line("WARN", "skipped", f"set {', '.join(missing_core)} first")
elif not C8LAB_PATH.exists():
    line("WARN", "skipped", "c8lab.py not found")
else:
    try:
        # Import c8lab in place (it reads env at import) and run its own check().
        import importlib.util
        spec = importlib.util.spec_from_file_location("c8lab", C8LAB_PATH)
        c8 = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(c8)
        print("  --- c8lab check output " + "-" * 32)
        c8.check()
        print("  " + "-" * 55)
        line("PASS", "c8lab check completed")
    except Exception as e:
        line("FAIL", "c8lab check failed", str(e).split(chr(10))[0])


# --- summary ----------------------------------------------------------------
print(f"\nSummary: {ok_count} ok, {fail_count} failed.")
if fail_count == 0:
    print("Ready for DevNet.\n")
    sys.exit(0)
else:
    print("Not ready for DevNet — resolve the FAIL lines above.\n")
    sys.exit(1)
