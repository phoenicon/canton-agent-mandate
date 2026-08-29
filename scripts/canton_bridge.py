#!/usr/bin/env python3
"""Local Cantor8 DevNet live-settlement bridge (operator tool).

Runs on 127.0.0.1 only; DevNet credentials stay server-side (read from env, never
hard-coded, never sent to the browser). A permitted mandate decision drives ONE
real Token Standard transfer of 1 CC from PARTY to GREENFEED_PARTY.

Verified reality this reflects: the transfer creates a real Token Standard
**OFFER** — 1 CC is locked in a TransferInstruction, so the sender's spendable
balance drops (e.g. 10 -> 9 CC). Receiver acceptance is **PENDING**: this is
**not** final settlement, and authorisation (Daml) and settlement (Token
Standard) are **separate, non-atomic** steps. A one-shot safety lock prevents
spending more than a single 1 CC during a demo.
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

TOOLKIT = os.path.expanduser(os.environ.get("C8_TOOLKIT", "~/hackathon-toolkit"))
if TOOLKIT not in sys.path:
    sys.path.insert(0, TOOLKIT)

import c8lab

HOST = "127.0.0.1"
PORT = 8787

SENDER = os.environ["PARTY"]
RECEIVER = os.environ["GREENFEED_PARTY"]

DSO = "DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a"

# Avoid broken shared-DevNet DSO discovery.
c8lab.dso_party = lambda *args, **kwargs: DSO

spent_once = False

def total_cc(party):
    hs = c8lab.holdings(party)
    total = sum(float(h["amount"]) for h in hs if not h["locked"])
    return total, hs

class Handler(BaseHTTPRequestHandler):

    def _json(self, status, body):
        raw = json.dumps(body, indent=2).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self._json(200, {"ok": True})

    def do_GET(self):
        if self.path != "/holdings":
            return self._json(404, {"error": "not found"})

        try:
            total, hs = total_cc(SENDER)
            self._json(200, {
                "ok": True,
                "party": SENDER,
                "total": total,
                "holdings": hs
            })
        except Exception as e:
            self._json(500, {"ok": False, "error": str(e)})

    def do_POST(self):
        global spent_once

        if self.path != "/settle":
            return self._json(404, {"error": "not found"})

        if spent_once:
            return self._json(409, {
                "ok": False,
                "error": "safety lock: live settlement already executed once"
            })

        try:
            before, before_holdings = total_cc(SENDER)

            result = c8lab.transfer(
                sender=SENDER,
                receiver=RECEIVER,
                amount=1
            )

            after, after_holdings = total_cc(SENDER)

            spent_once = True

            kind = result.get("transferKind")
            is_offer = kind == "offer"

            self._json(200, {
                "ok": True,
                "mandateDecision": "PERMITTED",
                "commercialRequest": "£240 to GreenFeed",   # £240 != 1 CC
                "settlementProof": "1 CC",
                "sender": SENDER,
                "receiver": RECEIVER,
                "before": before,
                "after": after,
                "lockedInOffer": round(before - after, 4),
                "transferKind": kind,
                "status": "OFFER CREATED" if is_offer else (kind or "UNKNOWN"),
                "receiverAcceptance": "PENDING" if is_offer else "N/A",
                "finalSettlement": False,
                "note": ("Real Token Standard transfer OFFER: 1 CC locked, "
                         "spendable reduced. NOT final settlement; receiver "
                         "acceptance pending. Authorisation and settlement are "
                         "separate, non-atomic steps."),
                "instructionCid": result.get("instructionCid"),
                "beforeHoldings": before_holdings,
                "afterHoldings": after_holdings
            })

        except Exception as e:
            self._json(500, {
                "ok": False,
                "error": str(e)
            })

    def log_message(self, fmt, *args):
        print("[bridge]", fmt % args)

if __name__ == "__main__":
    print("Canton live-settlement bridge")
    print(" sender:   ", SENDER)
    print(" receiver: ", RECEIVER)
    print(" listen:    http://127.0.0.1:8787")
    print(" safety:    one intentional 1 CC transfer per process")
    print()
    HTTPServer((HOST, PORT), Handler).serve_forever()
