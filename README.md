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

## What we built

### 1. Agent Mandate — the primary challenge implementation

A farm owner delegates limited financial authority to an AI agent. The mandate
enforces in Daml:

- £500 total spend cap
- approved counterparties
- expiry
- owner revocation
- immutable receipts for authorised charges

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

## Evidence

**12 / 12 Daml scripts green**

- under-cap charge succeeds
- over-cap charge rejected
- disallowed counterparty rejected
- post-revocation charge rejected
- agent cannot revoke its own mandate
- stranger cannot charge
- empty allow-list blocks spending
- correct FarmNote investor can accept
- wrong investor rejected
- issuer / investor / regulator visibility confirmed
- outsider sees no FarmNote contract
- outsider cannot exercise FarmNote choices

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
