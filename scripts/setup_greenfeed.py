#!/usr/bin/env python3
import os
import sys

TOOLKIT = os.path.expanduser(os.environ.get("C8_TOOLKIT", "~/hackathon-toolkit"))
if TOOLKIT not in sys.path:
    sys.path.insert(0, TOOLKIT)

import c8lab

hint = os.environ.get("GREENFEED_HINT", "greenfeed")
user = os.environ.get("C8_USER", "validator-backend@clients")

try:
    found = c8lab.call(
        f"/v2/parties?filter-party={hint}&pageSize=20",
        sub=user,
        method="GET",
    )
    details = found.get("partyDetails", []) if isinstance(found, dict) else []
except Exception:
    details = []

party = None

for p in details:
    value = p.get("party", "")
    if value == hint or value.startswith(hint + "::"):
        party = value
        break

if not party:
    created = c8lab.call(
        "/v2/parties",
        {"partyIdHint": hint},
        sub=user,
    )
    party = created["partyDetails"]["party"]

c8lab.grant_act_as(user, party, sub=user)

print(party)
print()
print("Set this in the shell:")
print(f"export GREENFEED_PARTY='{party}'")
