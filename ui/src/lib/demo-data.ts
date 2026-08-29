/**
 * DEMO DATA MODULE — UI demonstration state only.
 *
 * This is the single source of mocked ledger state for the AIGENT.FARM demo.
 * Replace this module with a Canton/Daml adapter (JSON API / ledger client)
 * to drive the same UI from real contracts. No other file holds demo state.
 */

export type Role = "investor" | "spv" | "regulator" | "outsider";

export const roles: {
  id: Role;
  label: string;
  party: string;
  badge: string;
}[] = [
  {
    id: "investor",
    label: "Investor",
    party: "Meridian Land Partners LLP",
    badge: "STAKEHOLDER · CAN ACCEPT",
  },
  {
    id: "spv",
    label: "Farm SPV",
    party: "Eastcott FarmCo SPV Ltd",
    badge: "SIGNATORY · ISSUER",
  },
  {
    id: "regulator",
    label: "Regulator",
    party: "UK Financial Supervisor",
    badge: "OBSERVER · READ ONLY",
  },
  {
    id: "outsider",
    label: "Outsider",
    party: "Unrelated Party Ltd",
    badge: "NON-STAKEHOLDER · NO VIEW",
  },
];

export const farm = {
  name: "Higher Eastcott Farm",
  farmId: "EASTCOTT-DEV",
  investment: "£1,200,000",
  units: "12,000",
  unitPrice: "£100",
  location: "Devon, United Kingdom",
  use: "Regenerative pasture & feed infrastructure",
};

export const farmNoteOffer = {
  template: "FarmNoteOffer",
  issuer: "Eastcott FarmCo SPV Ltd",
  investor: "Meridian Land Partners LLP",
  observer: "UK Financial Supervisor",
  farmId: "EASTCOTT-DEV",
  units: "12,000",
  unitPrice: "£100",
  notional: "£1,200,000",
  tenor: "60 months",
  couponTarget: "6.25% p.a. (target, not guaranteed)",
  status: "Offered",
};

export const farmNoteHolding = {
  template: "FarmNoteHolding",
  holder: "Meridian Land Partners LLP",
  issuer: "Eastcott FarmCo SPV Ltd",
  observer: "UK Financial Supervisor",
  farmId: "EASTCOTT-DEV",
  units: "12,000",
  unitPrice: "£100",
  notional: "£1,200,000",
  status: "Accepted — holding created on ledger (UI demonstration)",
};

export const mandate = {
  template: "AgentMandate",
  owner: "Higher Eastcott Farm (Owner)",
  agent: "AI Farm Agent — procurement",
  cap: "£500",
  approvedCounterparties: ["GreenFeed Ltd"],
  expiry: "30 September 2026",
  revocable: true,
};

// Live settlement demo constants, from the real DevNet operator run. The
// commercial request (£) is deliberately distinct from the technical settlement
// proof (CC): £240 != 1 CC. The transfer created an OFFER — 1 CC is locked in a
// TransferInstruction pending receiver acceptance; no final settlement claimed.
export const settlement = {
  sender: "colin-agent",
  instrument: "Amulet",
  proofCC: "1 CC",
  before: "10 CC",
  spendableAfter: "9 CC",
  lockedInOffer: "1 CC",
  transferKind: "offer",
  instructionCid: "00b1d524…62ef8fe6",
  network: "Cantor8 DevNet",
};

export type AttemptId = "ok" | "cap" | "counterparty";

export type AttemptResult = {
  id: AttemptId;
  label: string;
  amount: string;
  counterparty: string;
  outcome: "permitted" | "rejected";
  headline: string;
  reason: string;
  detail: string;
  rule: string;
  balance?: string;
};

export const paymentAttempts: AttemptResult[] = [
  {
    id: "ok",
    label: "Pay £240 to GreenFeed",
    amount: "£240",
    counterparty: "GreenFeed Ltd",
    outcome: "permitted",
    headline: "PERMITTED BY MANDATE",
    reason: "within cap + approved counterparty",
    detail: "Within £500 total cap, counterparty on allow-list, mandate active.",
    rule: "AgentMandate.SpendWithinCap",
    balance: "Spent £240 / Remaining £260",
  },
  {
    id: "cap",
    label: "Pay £900 to GreenFeed",
    amount: "£900",
    counterparty: "GreenFeed Ltd",
    outcome: "rejected",
    headline: "REJECTED BY CONTRACT RULE",
    reason: "exceeds £500 cap",
    detail: "£900 exceeds the £500 total mandate cap.",
    rule: "ensure amount <= cap",
  },
  {
    id: "counterparty",
    label: "Pay £100 to Unknown Supplier",
    amount: "£100",
    counterparty: "Unknown Supplier",
    outcome: "rejected",
    headline: "REJECTED BY CONTRACT RULE",
    reason: "counterparty not on allow-list",
    detail: "Unknown Supplier is not an approved counterparty on this mandate.",
    rule: "ensure counterparty `elem` approved",
  },
];

export const evidence: { label: string; note: string }[] = [
  { label: "12 Daml scripts passing", note: "test suite" },
  { label: "FarmNote acceptance tested", note: "happy path" },
  { label: "Wrong investor rejected", note: "authorisation" },
  { label: "Per-party ledger visibility tested", note: "privacy" },
  { label: "Outsider visibility rejected", note: "privacy" },
  { label: "Adversarial agent-authority tests passing", note: "bounded authority" },
  { label: "Cantor8 DevNet ledger connected", note: "live environment" },
];
