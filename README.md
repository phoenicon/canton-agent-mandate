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

### The judge-facing demo

```bash
python3 adapter/demo.py            # settlement simulated (no ledger needed)
python3 adapter/demo.py --live     # settle via real c8lab token transfers
```

It runs the whole scenario through the real Daml mandate on a simulated ledger,
then prints the audit statement from the ledger's own numbers:

```
AGENT MANDATE AUDIT
Budget granted:            100.00 Amulet
Successfully spent:        80.00 Amulet
Remaining:                 20.00 Amulet
Valid charges:             2
Rejected by cap:           1
Rejected by counterparty:  1
Rejected after revocation: 1
Ledger enforced:           YES
```

### DevNet preflight

This repo targets **DevNet** (not LocalNet). Configure the environment, then run
the preflight before spending a token on a real run:

```bash
cp .env.example .env       # fill in C8_CLIENT_SECRET and C8_REGISTRY from the team
source .env
python3 adapter/doctor.py
```

`doctor.py` is read-only. It confirms Daml 3.4.10 is the project SDK, that the
external `c8lab.py` is found, that the required DevNet env vars are set, and then
runs `c8lab check` (ledger, parties, balances). It masks secrets and exits
non-zero until everything needed for DevNet is green. No secret is ever written
to the repo — `.env` is gitignored; `.env.example` is a secret-free template.

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

## Connecting to a real payment flow

The whole security property is: **an agent must not be able to cause a payment
unless the Daml mandate authorises it.** The integration keeps every spending
decision in Daml and gives Python only two menial jobs — ask, then settle.

```
   agent ──exercise Charge──►  ┌──────── Daml Mandate ────────┐
                               │  cap ✓  allow-list ✓         │   THE enforcer
                               │  expiry ✓  revoked? ✗        │   (on-ledger, tested)
                               └──────────────┬───────────────┘
                                    authorised │ → ChargeReceipt
                                               ▼
   adapter/demo.py ──reuses──►  c8lab.transfer()  ── Canton Coin (Amulet) moves
                                (called ONLY for a charge Daml authorised)
```

- [`adapter/agent_wallet.py`](adapter/agent_wallet.py) — the adapter. It runs the
  Daml scenario on a **simulated in-memory ledger**
  (`daml script --ide-ledger`) and reads back an audit report whose every figure
  is the result of a real `Charge` / `Revoke` exercise. Then `settle()` performs
  the payment by **reusing `c8lab.transfer` verbatim** — the toolkit's real
  token-standard two-phase flow (registry factory + disclosed contracts). It
  imports `c8lab.py` from the toolkit; it does not copy or reimplement it.
- [`adapter/demo.py`](adapter/demo.py) — the terminal demo above. It decides
  nothing about spending; it prints the ledger's numbers and settles what the
  ledger authorised.

The adapter's one rule: **no `Charge` authorisation ⇒ no `transfer()` call.** It
cannot raise a cap or add a counterparty — only the ledger can.

## The honest boundary: what is real, what is not yet

**Real, now:** every cap / allow-list / expiry / revocation decision, enforced by
Daml and proven by `daml test` and by the demo's `submitMustFail` guards (which
abort the run if the ledger ever wrongly authorises a charge). The audit numbers
come from the ledger, not from Python.

**Not executed yet — and not faked:**

1. **No live value moves this milestone.** LocalNet is intentionally not stood
   up and DevNet needs a `C8_CLIENT_SECRET` we do not have, so no Canton ledger
   is reachable. The demo therefore prints settlement as `SIMULATED` and moves no
   coin. The real code path (`c8lab.transfer`) is wired behind `--live` and runs
   the moment a ledger + registry are configured; it never reports a transfer
   that did not happen.
2. **Authorise and settle are two steps, not one atomic transaction.** Today the
   adapter authorises in Daml, then settles via a separate token transfer. If the
   transfer failed after a successful `Charge`, the mandate would already show the
   spend. The **atomic** design removes this gap: make `Charge` perform the
   transfer as a *nested exercise*. That works because the **owner is a signatory
   of the `Mandate`**, so the owner's authority — needed to move the owner's coin
   — is available inside `Charge`, while the agent (no act-as rights on the owner)
   can never move funds except through a `Charge` that passed.

   **Feasibility check (done, not yet built):** compiling that nested exercise
   needs the Splice token-standard interface DARs
   (`splice-api-token-transfer-instruction-v1`, `-holding-v1`, `-metadata-v1`,
   `splice-wallet`) as `data-dependencies`. **None are present locally** — the
   SDK and toolkit ship only `daml-prim` / `daml-stdlib` / `daml-script`. On top
   of that, the transfer uses the registry factory pattern (off-ledger
   `factoryId` + choice context + disclosed contracts), which a choice cannot
   fetch — those must be threaded into `Charge` as arguments and attached at
   submit time — and the DAR package IDs must match what DevNet actually runs.
   So it is **plausible but not "clearly straightforward"**, and only testable
   against live DevNet. Deferred deliberately; see the estimate at the bottom.
3. **No agent integration or frontend.** No MCP server / LLM holds the wallet yet
   (out of scope for this milestone); the `ChargeReceipt` contracts are the
   audit data a UI would render.

## Design decisions

- **`Charge` is consuming** (the Daml default): it archives the old `Mandate` and
  creates the successor with the higher `spent`, plus the `ChargeReceipt`, in one
  transaction. (Earlier it was `nonconsuming` with a manual `archive self`;
  consuming is simpler and matches the starter idiom.)
- **Total cap only.** Per-period ("100/month") limits were deliberately left
  out — they turn into date arithmetic and the D1 guidance is to land the total
  cap first. Noted as the next step.
- **Enforcement stays in Daml.** The Python adapter is stdlib-only and holds no
  spending logic, by design — so it cannot become a second, weaker rule set.
- Dropped the starter's `Iou.daml`; it is teaching scaffolding unrelated to D1.

## Smallest path to atomic `Charge` → token movement (estimate, not built)

Ordered by what blocks what. The gating risk is step 1, and none of it is
testable without live DevNet.

1. **Get the Splice token-standard interface DARs** at the exact versions DevNet
   runs (from the Cantor8 team / a Splice release / extracted from a participant's
   package store). This is the real blocker — they are not on this machine.
2. Add them to `daml.yaml` as `data-dependencies`, and model the interface types
   (`TransferFactory`, `TransferFactory_Transfer`, `ExtraArgs` / choice context).
3. Extend `Charge` to take `factoryId` and the forwarded choice-context blob as
   arguments, and after the guards `exercise` `TransferFactory_Transfer` with
   `sender = owner` (owner is a signatory, so the authority is present).
4. In the adapter, fetch factory + context + disclosed contracts from the
   registry (reuse the logic already in `c8lab.transfer`), then submit
   `exercise Charge {…, factoryId, context}` with the disclosed contracts
   attached — one transaction, authorise and settle together.
5. Verify on DevNet only. There is no offline test for the transfer leg.

Effort once step 1 lands: modest (~a day of Daml + adapter wiring). Risk is
concentrated in version-matching the DARs and modelling the choice context.
Per instruction, **not implemented** — it is not clearly straightforward.

---

Started from `~/hackathon-toolkit/daml-starter` (SDK 3.4.10, target 2.1). SDK
version deliberately unchanged. The adapter reuses `~/hackathon-toolkit/c8lab.py`
(override its location with the `C8LAB` env var).
