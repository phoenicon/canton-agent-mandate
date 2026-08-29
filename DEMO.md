# DEMO — 60–90 second judge path

A tight walkthrough of **Canton Agent Mandate** — ledger-enforced financial
authority for AI agents — shown in the *AIGENT.FARM* demo app. The Agent Mandate
is the core; FarmNote is a privacy extension.

## 1. Problem (10s)

> **We gave an AI agent money, then tried to make it misbehave.**

Model-level safety alone is not enough for financial authority: a model can be
jailbroken, prompt-injected, or simply wrong. Safety has to sit below the model,
where the model cannot reach it — on the ledger.

## 2. Mandate (25s)

Owner delegates bounded authority to an AI agent. Run the payment attempts:

- **£240 → approved supplier (GreenFeed)** → **permitted** (within cap, on allow-list).
- **£900 → approved supplier** → **rejected** — exceeds the £500 cap.
- **£100 → unknown supplier** → **rejected** — counterparty not on the allow-list.
- **Revoke mandate**, then attempt again → **rejected** — the mandate is gone.

> **The model can be compromised. The mandate still holds.**

## 3. FarmNote — privacy extension (25s)

Show **Higher Eastcott Farm**. Switch the party view across the four tabs:

- **Investor** — sees the offer, and is the only party who can Accept.
- **Farm SPV** — issuer, sees the offer and any resulting holding.
- **Regulator** — observes, read-only, no transaction rights.
- **Outsider** — **no authorised view**: no payload, no party names, no amounts.

> **The privacy difference isn't CSS. Our Daml tests query the ledger
> independently as each participant.**

Then **Accept the FarmNote** as the investor and show the resulting
`FarmNoteHolding`.

## 4. Technical evidence (10s)

> **12 / 12 Daml scripts green.**

Authority and privacy are proven by adversarial `submitMustFail` tests and
per-party `queryContractId` visibility tests. Cantor8 DevNet is connected —
Keycloak auth, registry, reachable Ledger API, ledger end advancing.

## 5. Close (5s)

> **Capital has rules. Agents have rules. Canton enforces both.**

---

## Do not claim

- No atomic FarmNote + Canton Coin settlement.
- No live cash leg.
- No live Token Standard integration, unless subsequently proven in the repo.
