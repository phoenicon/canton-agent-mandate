# DevNet — Cantor8 connectivity

How this project connects to the shared Cantor8 Canton DevNet, what is verified,
and what is deliberately not claimed.

## Two repositories, two jobs

- **`hackathon-toolkit`** (external, reused in place) — DevNet infrastructure: the
  `c8lab.py` helper, auth, party/holdings/registry calls. Not vendored into this
  repo; the adapter imports it via the `C8LAB` env var.
- **`canton-agent-mandate`** (this repo) — the application: the Daml contracts
  (`Mandate`, `FarmNote`) and their tests, the Python adapter, and the UI.

## Authentication

DevNet uses **Keycloak** (client-credentials). Setting `C8_IDP` flips `c8lab`
from LocalNet's self-signed HS256 tokens to a real Cantor8 Keycloak token; every
Ledger API call then carries `Authorization: Bearer <token>`. The token registry
is configured via `C8_REGISTRY`. See [`.env.example`](.env.example) and run
[`adapter/doctor.py`](adapter/doctor.py) to check the wiring.

**Verified:** Keycloak auth succeeds, the registry is configured, the Ledger API
is reachable, and the ledger end is observed advancing.

## Parties: hints vs full IDs

A Canton party ID is a human-readable **hint** plus a namespace fingerprint, e.g.

```
colin-agent::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f
```

Only the complete ID (`hint::fingerprint`) identifies a party on the ledger; the
hint alone (`colin-agent`) does not.

The shared DevNet hosts **thousands of parties**, so full enumeration is slow.
Once you know the complete party ID, prefer **exact-party queries** over listing.
Our dedicated party above has been queried directly and its holdings query works.

**An empty holdings array means the query succeeded but the party may simply be
unfunded** — it is not an error, and it is not proof of a zero balance failure.
The party may still be unfunded at time of reading.

## Intended flow

```
Identity / Party
      ↓
authority
      ↓
transfer preapproval
      ↓
funding
      ↓
holdings
      ↓
Token Standard transfer
```

Verified today: **the whole chain up to a Token Standard transfer offer.**
Identity/party, `CanActAs`, a submitted transfer preapproval, real funding
(`colin-agent` held 10 CC as two unlocked 5 CC Amulet holdings), and a real
Token Standard transfer **offer** of 1 CC to `greenfeed` — spendable 10 → 9 CC,
1 CC locked in the offer (`transferKind: offer`). **Final receiver acceptance is
still pending** (the accept path hit a registry choice-context 404). See the
boundary below and [docs/devnet/TOKEN-TRANSFERS.md](docs/devnet/TOKEN-TRANSFERS.md).

## Architecture distinction

```
AI decides what it wants to do.
Canton decides what it is allowed to do.
```

**The model can be compromised. The mandate still holds.**

## Honesty boundary

This project **separates mandate authorisation (Daml) from token settlement**.
They are two steps, not one ledger transaction.

- Unless both are combined in a single ledger transaction, **do not claim atomic
  authorisation + settlement.**
- **A real Token Standard transfer offer was created** (1 CC locked, 10 → 9 CC
  spendable). **Do not claim final settlement** — receiver acceptance is pending,
  so `greenfeed` has **not** received the 1 CC. An `offer` is not final settlement.
- What *is* claimed: the Daml authority and privacy rules are implemented and
  tested; DevNet authentication + `CanActAs` are working; 10 CC real funding; and
  a real 1 CC Token Standard transfer offer to `greenfeed`, acceptance pending.
