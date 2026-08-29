# Architecture

How AIGENT.FARM is put together, and the honest line between what is authorised
and what is settled.

## Two control planes

Canton lets us enforce two *different* kinds of authority separately, on the same
ledger:

- **Operational authority** — what an AI agent may spend. Enforced by the
  `Mandate` contract: cap, allow-list, expiry, owner revocation.
- **Capital authority** — who may hold and see a private investment. Enforced by
  the `FarmNote` contracts: issuer/investor signatories, regulator observer, and
  no visibility for anyone else.

They are independent. An investor committing £1.2m to the farm does not widen the
agent's £500 spend cap by a penny.

## Identity chain

Every action on DevNet resolves down this chain before any contract rule runs:

```
Keycloak  →  Ledger API user  →  CanActAs  →  Canton Party  →  contracts / assets
```

- **Keycloak** issues the client-credentials token (DevNet auth).
- The token names a **Ledger API user**; a user is not yet a party.
- **CanActAs** grants that user the right to submit *as* a party (the fix for the
  common 403).
- The **Canton Party** (`hint::fingerprint`) is the on-ledger identity that
  signatory/observer/controller rules are written against.
- Only then do the **contract** rules (mandate cap, allow-list; FarmNote
  visibility) apply.

See [DEVNET.md](DEVNET.md) for party hints vs full IDs and the funding flow.

## Authorisation vs settlement (the honest separation)

This project deliberately separates **authorisation** (a Daml decision) from
**settlement** (moving Canton Coin).

- **Authorisation** is real and tested: the `Mandate.Charge` choice decides,
  on-ledger, whether a spend is permitted.
- **Settlement** — the actual Canton Coin / Token Standard transfer — is a
  separate step and is **not** combined with authorisation in one transaction.

Because the two are separate, we do **not** claim atomic authorisation +
settlement. Making `Charge` perform the transfer as a single nested exercise is
the next integration layer, and it needs the Splice token-standard DARs plus a
live registry.

## Component map

```
        ┌────────────────────────────────────────────┐
        │  ui/  (TanStack Start · React 19 · TS)       │
        │  visualisation only                          │
        │  mock state → src/lib/demo-data.ts           │
        └───────────────────────┬──────────────────────┘
                                │  (not yet wired)
        ┌───────────────────────┴──────────────────────┐
        │  adapter/  (Python, stdlib)                   │
        │  doctor.py preflight · demo.py · agent_wallet │
        │  reuses c8lab externally (C8LAB env var)      │
        └───────────────────────┬──────────────────────┘
                                │  Ledger API / registry
        ┌───────────────────────┴──────────────────────┐
        │  daml/  (Daml 3.4.10)                         │
        │  Mandate · FarmNote  + tests (source of truth)│
        └───────────────────────┬──────────────────────┘
                                │
        ┌───────────────────────┴──────────────────────┐
        │  hackathon-toolkit/  (external, not vendored) │
        │  c8lab.py · DevNet infra · Keycloak · registry│
        └────────────────────────────────────────────────┘
```

The Daml layer is the source of truth. The adapter talks to Canton; the toolkit
provides DevNet plumbing and is reused in place, never copied into this repo.
