# AIGENT.FARM

**Private farm capital. Bounded AI authority. Enforced by Canton.**

We built two Daml workflows around one idea: financial authority should be
explicit, private, and enforceable **below the AI model**.

- An AI farm agent can spend only within a ledger-enforced mandate.
- A Farm SPV can issue a private FarmNote visible only to the parties who should
  see it.

> **The model can be compromised. The mandate still holds.**

## What we built

### 1. Bounded Farm Operations — Agent Mandate

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

### 2. Private Farm Capital — FarmNote

A Farm SPV privately offers a FarmNote to a named investor.

```
Farm SPV      issuer / signatory
Investor      stakeholder / can accept
Regulator     observer / read-only
Outsider      no authorised view
```

The privacy boundary is tested with independent per-party `queryContractId`
calls — not inferred from the UI.

## Why the two pieces belong together

Capital authority and operational authority are different. Canton lets us enforce
both separately.

An investor may commit £1.2m to the farm. **The AI agent still cannot spend £501
without permission.**

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
                    AIGENT.FARM
                         │
           ┌─────────────┴─────────────┐
           │                           │
    FARM OPERATIONS              FARM CAPITAL
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

*Capital has rules. Agents have rules. Canton enforces both.*
