# canton-agent-mandate

**Challenge D1 — a spend-limited wallet for an AI agent, on Canton/Daml.**

An owner grants an AI agent a *mandate*: it may spend up to a total cap, only
with an allow-listed set of counterparties, until an expiry — and the owner can
revoke instantly without the agent's cooperation. Every one of those limits is
enforced **on the ledger, in Daml**, not in a backend. Every charge writes a
signed, human-readable audit record.

## Run it

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="$HOME/.daml/bin:$JAVA_HOME/bin:$PATH"

daml build
daml test
```

Expected:

```
daml/Test.daml:testMandate: ok, 2 active contracts, 9 transactions.
daml/Test.daml:testExpiry:  ok, 2 active contracts, 5 transactions.
```

`daml test` runs in-memory in about a second. No node, no Docker, no network.

## Architecture

Two contracts, one proposal, in [`daml/Mandate.daml`](daml/Mandate.daml):

- **`Mandate`** — the wallet. Signed by both `owner` and `agent`. Holds `cap`,
  `spent`, the `allowed` counterparty list, and `expiresAt`. Choices:
  - `Charge` — the agent spends. Guards, all on-ledger (search `[ENFORCED]`):
    not expired, amount positive, `spent + amount <= cap`, and
    `payTo` on the allow-list. Produces the successor `Mandate` **and** a
    `ChargeReceipt`.
  - `Revoke` — `controller owner` only. The agent is not a controller, so it
    cannot block or delay it. Consuming: the mandate is gone the instant it runs.
  - `Adjust` — `controller owner, agent`. Changing the cap needs both
    signatures, so the agent cannot raise its own limit.
- **`ChargeReceipt`** — one immutable, dual-signed contract per charge: amount,
  counterparty, cumulative `spentAfter`, `capAtCharge`, timestamp, and
  `authorisedBy` (which permission allowed it, in words). This is the audit
  trail — the statement the owner reads afterwards.
- **`MandateProposal`** — owner offers, agent `Accept`s (or `Reject`s). Standard
  propose/accept, because a two-signatory contract can't be forced onto the agent.

### How each D1 requirement is met

| # | Requirement | Where |
|---|---|---|
| 1 | Owner grants agent a mandate | `MandateProposal` → `Accept` |
| 2 | Total spend cap enforced in Daml | `Charge`: `spent + amount <= cap` |
| 3 | Counterparty allow-list enforced in Daml | `Charge`: ``payTo `elem` allowed`` |
| 4 | Expiry enforceable | `Charge`: `now < expiresAt` |
| 5 | Owner revokes immediately, agent can't block | `Revoke`, `controller owner` |
| 6 | Human-readable audit trail | `ChargeReceipt` per charge |
| 7 | Tests prove the four cases | [`daml/Test.daml`](daml/Test.daml) |
| 8 | Enforcement on-ledger, not backend | all guards live in choice bodies |

The tests in `testMandate` prove: a valid charge under cap succeeds, a charge
over the remaining cap fails, a disallowed counterparty fails, and a charge
after revocation fails. `testExpiry` proves charges are rejected past
`expiresAt`. `submitMustFail` is the assertion that the ledger *rejects* an
action — that is what makes these security proofs rather than happy-path checks.

## Design decisions

- **`Charge` is `nonconsuming`** and archives/recreates the mandate explicitly,
  so it can atomically emit both the successor mandate and the receipt in one
  transaction while keeping a clean create/archive chain.
- **Total cap only.** Per-period ("100/month") limits were deliberately left
  out — they turn into date arithmetic and the D1 guidance is to land the total
  cap first. Noted as the next step.
- Dropped the starter's `Iou.daml`; it is teaching scaffolding unrelated to D1.

## What is still mocked / not yet built

- **No real value moves.** `Charge` records spend and writes a receipt but does
  not transfer a token. Wiring `Charge` to a Canton token-standard transfer is
  the next real step (see the toolkit's `c8lab.py` for a working transfer).
- **No LocalNet / live node.** Everything runs in the in-memory Daml Script
  test ledger. No participant node has been stood up yet.
- **No agent integration and no frontend.** There is no MCP server or LLM
  holding the wallet yet, and no statement UI — the `ChargeReceipt` contracts
  are the machine- and human-readable audit data a UI would render.

Started from `~/hackathon-toolkit/daml-starter` (SDK 3.4.10, target 2.1). SDK
version deliberately unchanged.
