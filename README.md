# AIGENT.FARM — Private farm capital + bounded AI authority on Canton

AIGENT.FARM uses Daml to enforce private farm investment workflows and strictly
bounded financial authority for autonomous agents.

## Why Canton

- **Ledger-enforced authority** — spending limits are rules in the contract, not
  checks in a backend, so they hold even against a party talking to the ledger
  directly.
- **Per-party privacy** — visibility is a stakeholder property of each contract,
  proven from independent per-party ledger views.
- **Multi-party financial workflows** — propose/accept, revocation, and
  regulator observation are native.
- **Programmable ownership and control** — who may do what is encoded and tested.

## Two demo primitives

**Agent Mandate** — a farm owner delegates bounded financial authority to an AI
agent: `cap` · `allow-list` · `expiry` · owner `revocation`, and proven attack
resistance. The AI decides what it wants to do; Canton decides what it is allowed
to do.

**FarmNote** — a Farm SPV privately offers a note to a named investor:
`FarmNoteOffer → Accept → FarmNoteHolding`. Issuer and investor see it, the
regulator observes read-only, and an outsider has no contract visibility at all.

## Evidence

**12 / 12 Daml scripts green.** The tests are the submission:

- **Mandate authority** — over-cap rejected · disallowed counterparty rejected ·
  post-revocation rejected · agent cannot revoke · stranger cannot charge · owner
  cannot misuse the agent-only `Charge` · empty allow-list blocks spending · a
  cap adjustment does not widen the allow-list.
- **FarmNote privacy** — correct investor can accept · wrong investor rejected ·
  issuer/investor/regulator visibility confirmed · outsider non-visibility, all
  via independent per-party `queryContractId` · outsider cannot exercise any
  FarmNote choice.

## Run

Daml (in-memory, ~1s, no network):

```bash
daml build
daml test
```

DevNet preflight (see [DEVNET.md](DEVNET.md)):

```bash
source .env
python3 adapter/doctor.py
```

UI (dev server):

```bash
cd ui
npm install
npm run dev
```

UI (production build):

```bash
npm run build
```

## DevNet

Cantor8 DevNet connectivity, party model, and the honest boundary are documented
in [DEVNET.md](DEVNET.md).

## Honest boundary

- The **UI visualises** the workflows; its demo state is isolated in
  `ui/src/lib/demo-data.ts`.
- The **Daml rules and privacy are implemented and tested** (12/12 green).
- **DevNet connectivity is working** — Keycloak auth, registry, reachable Ledger
  API, ledger end advancing.
- **FarmNote cash settlement is not currently claimed.**
- **Atomic Canton Coin settlement is not currently claimed.**
- **Token Standard integration is a separate next layer.**

---

*Capital has rules. Agents have rules. Canton enforces both.*
