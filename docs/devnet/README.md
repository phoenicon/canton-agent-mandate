# Real Canton DevNet integration

Engineering record of the live Cantor8 / Canton **DevNet** integration done for
**Canton Agent Mandate** at the Cantor8 BuildOnCanton hackathon, 29 August 2026.

This is real DevNet integration — **not simulated demo data**.

## The result

A real Canton party, **`colin-agent`**, was funded with **10 CC (Amulet)** on the
shared DevNet. The final exact-party holdings query returned two unlocked
holdings of `5.0000000000 Amulet` each:

```
Holding 1:  amount 5.0000000000  Amulet  locked=false
Holding 2:  amount 5.0000000000  Amulet  locked=false
Total: 10 CC
```

A `TransferPreapprovalProposal` was successfully submitted, and Ledger
`CanActAs` rights were established so the party could submit commands.

## Flow

```
Keycloak identity
      ↓
Ledger user / CanActAs
      ↓
colin-agent party
      ↓
Transfer preapproval
      ↓
10 CC / Amulet holdings
      ↓
Agent Mandate (Daml authority layer)
```

## Infrastructure coordinates (verified)

| Thing | Value |
|---|---|
| Agent party | `colin-agent::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f` |
| DSO | `DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a` |
| Synchronizer | `global-domain::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a` |
| Validator operator | `cantor8-digik-1::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f` |
| Ledger API | `https://api.validator.dev.digik.cantor8.tech/api/ledger` |
| IDP (Keycloak) | `https://auth.dev.digik.cantor8.tech` |
| Registry (working) | `https://sv-proxy.dev.digik.cantor8.tech` |

Engineering receipts for the preapproval submission:

| Field | Value |
|---|---|
| updateId | `1220ad507b5262fafcecd0b515c5ff1f47d10d392b93cc4b5ee07aede1c5fbeb9d29` |
| completionOffset | `2920631` |

## Detailed docs

- **[AUTH-AND-PARTIES.md](AUTH-AND-PARTIES.md)** — Keycloak client credentials, the
  JWT-subject / `C8_USER` issue, `CanActAs`, and why identity ≠ party.
- **[TOKEN-TRANSFERS.md](TOKEN-TRANSFERS.md)** — Holding interface, DSO, registry,
  transfer preapproval, the stale-offer issue, and the funding result.
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — symptom → cause → fix table for
  every error we actually hit.
- **[LESSONS-LEARNED.md](LESSONS-LEARNED.md)** — the reusable engineering lessons,
  tied back to the product thesis.

## Why this matters to Canton Agent Mandate

Canton Agent Mandate is about **bounded financial authority for AI agents**,
enforced on-ledger. Proving it on real DevNet means the mandate is not a paper
model: there is a real party, holding real Canton Coin, reachable through the
real authority chain (Keycloak → Ledger user → `CanActAs` → party → assets).

Authorisation (the Daml mandate) and settlement (the Canton Coin transfer) are
currently **separate steps**, not one atomic transaction — see the boundary in
[TOKEN-TRANSFERS.md](TOKEN-TRANSFERS.md). We do not claim atomic
authorisation + settlement.
