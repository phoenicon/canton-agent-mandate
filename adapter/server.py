#!/usr/bin/env python3
"""Tiny local settlement sidecar for the Canton Agent Mandate demo.

Runs on 127.0.0.1 only. Keeps DevNet credentials SERVER-SIDE — the browser never
sees C8_CLIENT_SECRET or any token; it only calls these localhost endpoints.

Endpoints:
  GET  /health    -> config sanity (no secrets)
  GET  /holdings  -> READ-ONLY balance of the sender party (safe, no enumeration)
  POST /settle    -> ONE real transfer, HARD-CAPPED to SETTLE_MAX_CC (default 1).
                     Refuses unless GREENFEED_PARTY is set. Never called
                     automatically by the UI — operator-triggered only.

Env (set in your shell / .env, never committed):
  C8_BASE C8_IDP C8_CLIENT_ID C8_CLIENT_SECRET C8_REGISTRY C8_USER
  C8LAB           path to hackathon-toolkit/c8lab.py (default ~/hackathon-toolkit)
  PARTY           sender full party id (colin-agent::...)
  GREENFEED_PARTY recipient full party id (unset => /settle disabled)
  SETTLE_MAX_CC   hard cap on a single settle (default 1)
  SETTLE_PORT     default 8787

Run:  python3 adapter/server.py
Stdlib only.
"""
import importlib.util
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

C8LAB = os.environ.get("C8LAB", os.path.expanduser("~/hackathon-toolkit/c8lab.py"))
PARTY = os.environ.get("PARTY", "")
GREENFEED = os.environ.get("GREENFEED_PARTY", "")
MAX_CC = float(os.environ.get("SETTLE_MAX_CC", "1"))
PORT = int(os.environ.get("SETTLE_PORT", "8787"))


def load_c8lab():
    spec = importlib.util.spec_from_file_location("c8lab", C8LAB)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def holdings_summary(c8, party):
    hs = c8.holdings(party)
    total = sum(float(h["amount"] or 0) for h in hs)
    return {"party": party.split("::")[0], "totalCC": total,
            "count": len(hs),
            "holdings": [{"amount": h["amount"], "instrument": h["instrument"],
                          "locked": h["locked"]} for h in hs]}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        payload = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *a):
        pass  # keep the demo terminal clean

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path.startswith("/health"):
            return self._send(200, {"ok": True, "sender": PARTY.split("::")[0] or None,
                                    "hasRecipient": bool(GREENFEED),
                                    "maxCC": MAX_CC})
        if self.path.startswith("/holdings"):
            if not PARTY:
                return self._send(400, {"error": "PARTY not set"})
            try:
                c8 = load_c8lab()
                return self._send(200, holdings_summary(c8, PARTY))
            except Exception as e:
                return self._send(502, {"error": str(e).split("\n")[0]})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/settle"):
            return self._send(404, {"error": "not found"})
        # Guard rails: recipient must be configured, amount is hard-capped.
        if not GREENFEED:
            return self._send(400, {"error": "GREENFEED_PARTY not set; /settle disabled"})
        if not PARTY:
            return self._send(400, {"error": "PARTY not set"})
        amount = MAX_CC  # ignore any client-supplied amount; hard cap wins
        try:
            c8 = load_c8lab()
            before = holdings_summary(c8, PARTY)["totalCC"]
            res = c8.transfer(PARTY, GREENFEED, amount)
            after = holdings_summary(c8, PARTY)["totalCC"]
            return self._send(200, {"status": "CONFIRMED", "amountCC": amount,
                                    "transferKind": res.get("transferKind"),
                                    "ccBefore": before, "ccAfter": after})
        except Exception as e:
            return self._send(502, {"status": "ERROR",
                                    "error": str(e).split("\n")[0]})


if __name__ == "__main__":
    print(f"settlement sidecar on http://127.0.0.1:{PORT}  "
          f"(sender={PARTY.split('::')[0] or 'UNSET'}, "
          f"recipient={'set' if GREENFEED else 'UNSET -> /settle disabled'}, "
          f"maxCC={MAX_CC})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
