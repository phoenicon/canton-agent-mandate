# Canton Agent Mandate

**Ledger-enforced financial authority for AI agents.**

An AI agent can be given money and a set of rules — a spend cap, an allow-list of
counterparties, an expiry, and an owner who can revoke at any time. The rules are
enforced in Daml, **below the AI model**, so they hold even if the model is
compromised.

> **The model can be compromised. The mandate still holds.**

*AIGENT.FARM* is the demo application this is shown in: an AI farm agent spending
under a mandate, and a Farm SPV issuing private capital. The submission itself is
the **Agent Mandate** — bounded, on-ledger financial authority.

![Canton Agent Mandate — summary](docs/images/hero-summary.png)

## What we built

![How it works — Agent Mandate and FarmNote workflow](docs/images/simple-workflow.png)

### 1. Agent Mandate — the primary challenge implementation

![Live demo — bounded agent spending](docs/images/ui-demo.png)

A farm owner delegates limited financial authority to an AI agent. The mandate
enforces in Daml:

- £500 total spend cap
- approved counterparties
- expiry
- owner revocation
- immutable receipts for authorised charges

Enforcement happens **not in the UI, not in Python, not in the model prompt — in
Daml on the ledger.**

Attack attempts are rejected on-ledger:

```
Allowed payment           PASS
Overspend attack          BLOCKED
Wrong counterparty        BLOCKED
Post-revocation payment   BLOCKED
```

**AI decides what it wants to do. Canton decides what it is allowed to do.**

### 2. FarmNote — a privacy / application extension

Built on top of the mandate work to show Canton's per-party privacy: a Farm SPV
privately offers a FarmNote to a named investor.

```
Farm SPV      issuer / signatory
Investor      stakeholder / can accept
Regulator     observer / read-only
Outsider      no authorised view
```

The privacy boundary is tested with independent per-party `queryContractId`
calls — not inferred from the UI.

## Why the extension belongs here

Capital authority and operational authority are different, and Canton lets us
enforce both separately. An investor may commit £1.2m to the farm. **The AI agent
still cannot spend £501 without permission.**

## Threat model

Do not trust the agent because its system prompt says "don't spend more than
£500." **Assume the agent may fail or be compromised. Constrain what it can
actually do.** The authority lives on the ledger, independent of the model, so a
jailbroken or buggy agent still cannot exceed it.

## Evidence

**12 / 12 Daml scripts green.** Every line below is a real script; the
`submitMustFail` guards mean the suite only passes if the ledger *rejects* each
prohibited action.

```text
daml/Adversarial.daml:setup: ok
daml/Adversarial.daml:agentCannotRevoke: ok
daml/Adversarial.daml:strangerCannotCharge: ok
daml/Adversarial.daml:ownerCannotCharge: ok
daml/Adversarial.daml:adjustDoesNotWidenAllowList: ok
daml/Adversarial.daml:emptyAllowListBlocksAll: ok
daml/Demo.daml:demo: ok
daml/FarmNoteTest.daml:testWrongInvestorCannotAccept: ok
daml/FarmNoteTest.daml:testFarmNoteAccept: ok
daml/FarmNoteTest.daml:testFarmNotePrivacy: ok
daml/Test.daml:testMandate: ok
daml/Test.daml:testExpiry: ok
```

If one of those prohibited actions succeeds, the test suite goes red.

<!-- TODO: embed docs/images/daml-tests.png here (screenshot of the passing `daml test` run) -->

## Receipt and audit trail

Every authorised charge creates an immutable `ChargeReceipt` on the ledger,
recording:

- counterparty (`payTo`)
- amount
- memo
- cumulative spend after the charge (`spentAfter`)
- mandate cap at the time (`capAtCharge`)
- timestamp (`chargedAt`)
- authorisation reason (`authorisedBy`)

Successful actions therefore leave a permanent, signed record. Rejected attempts
are demonstrated through failed submissions and the adversarial tests — they do
not create a successful charge, and so leave no receipt.

## Real Canton DevNet Integration

Beyond the in-memory tests, we connected to the shared **Cantor8 DevNet** and
proved the real authority chain end to end:

- a real Canton party, **`colin-agent`**, with real **Amulet (Canton Coin)**
  holdings — **10 CC**, as two unlocked 5.0 holdings
- a **`TransferPreapprovalProposal`** successfully submitted (with a recorded
  `updateId` and `completionOffset`)
- Ledger **`CanActAs`** rights established so the party can submit commands

```mermaid
flowchart TD
    A[Keycloak identity] --> B[Ledger user / CanActAs]
    B --> C[colin-agent party]
    C --> D[Transfer preapproval]
    D --> E[10 CC / Amulet]
    E --> F[Agent Mandate]
```

### Authorisation → settlement (two steps)

The demo runs a two-step path, in this order:

1. **Daml authorisation** — the Agent Mandate decides `PERMITTED` / `REJECTED`.
2. **Canton Token Standard settlement** — a real Amulet transfer, executed
   **only if step 1 permitted it**.

A permitted request produces a **real Token Standard transfer offer** on DevNet:
a **1 CC** transfer from `colin-agent` where the coin is **locked in a
`TransferInstruction`** (`transferKind: offer`) pending the receiver's
acceptance. Verified on-ledger: **before 10 CC → spendable after 9 CC, 1 CC
locked in the offer**. Receiver acceptance is pending, so **no final settlement
is claimed**. The commercial amount and the settlement amount are deliberately
distinct — **£240 ≠ 1 CC**; the CC transfer is a settlement *proof*, not the
commercial sum.

**Rejected requests never invoke settlement** — over-cap, unapproved
counterparty, and post-revocation attempts are stopped at step 1, so no transfer
is ever attempted and the balance is unchanged.

These are **separate steps, not one atomic transaction** — we do not claim atomic
authorisation + settlement. Full engineering record, coordinates, and debugging
notes: **[docs/devnet/](docs/devnet/README.md)**.

## Run it

Daml:

```bash
daml build
daml test
```

UI:

```bash
cd ui
npm install
npm run dev
```

Cantor8 DevNet:

```bash
source .env
python3 adapter/doctor.py
```

See **[DEVNET.md](DEVNET.md)** for the network / party / permission model,
**[DEMO.md](DEMO.md)** for the 60–90 second judge walkthrough, and
**[ARCHITECTURE.md](ARCHITECTURE.md)** for the two control planes and the
identity chain.

## Architecture

```
                 Canton Agent Mandate
                (AIGENT.FARM demo app)
                         │
           ┌─────────────┴─────────────┐
           │                           │
    FARM OPERATIONS              FARM CAPITAL
     (primary)                   (extension)
           │                           │
      Agent Mandate                 FarmNote
           │                           │
  cap / allow-list /          issuer / investor /
  expiry / revocation         regulator / outsider
           │                           │
           └─────────────┬─────────────┘
                         │
                 CANTON / DAML
            authority + privacy rules
```

## What is real today

**Implemented and tested**

- Agent Mandate contract
- FarmNote contract
- adversarial authority tests
- per-party privacy tests
- Cantor8 DevNet authentication and Ledger API connectivity
- working frontend visualisation

**Not claimed**

- FarmNote cash settlement
- atomic mandate authorisation + Canton Coin settlement
- live Token Standard settlement for the FarmNote
- fake transaction hashes or fake ledger state

The UI is a visualisation layer. The Daml rules and privacy tests are the source
of truth.

---

*AIGENT.FARM: capital has rules. Agents have rules. Canton enforces both.*
