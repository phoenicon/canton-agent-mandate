# Lessons learned — Canton DevNet integration

Reusable engineering lessons from funding a real Canton party on the shared
Cantor8 DevNet. Useful to any team doing token-standard work on Canton.

1. **Decode the JWT first.** The access token's `sub` / `client_id` / `azp` tell
   you who you actually are on the ledger. We lost time before decoding it;
   everything downstream (submit `userId`, `CanActAs`) has to match that subject.

2. **Identity and party authority are separate.** Authentication proves *who is
   calling*. `CanActAs` is a *separate grant* to act *as a party*. A valid token
   is not permission to act as any party.

3. **Know your exact infrastructure coordinates.** Full Party IDs for the agent,
   DSO, validator operator, and synchronizer — plus the ledger, IDP, and registry
   URLs — save hours. Discovery helpers are unreliable on a shared net.

4. **Avoid participant-wide discovery on shared environments.** ~5,784 parties
   made enumeration-based lookups hang. Use full identifiers directly.

5. **Visibility does not imply submission authority.** The old `farmfort2` party's
   20 Amulet holding was still visible, but submitting as it failed with
   `NO_SYNCHRONIZER_ON_WHICH_ALL_SUBMITTERS_CAN_SUBMIT`. Reading ≠ spending.

6. **Preapproval state and timing matter.** Auto-accept applied to *future*
   offers, not historical ones. Understand when the provider's automation acts.

7. **Fresh transfers beat resurrecting stale instructions.** A stale instruction
   came back `not found`. Issuing a new transfer into the working preapproval
   path was far cheaper than chasing the old one.

8. **Keep secrets out of the repo.** The client secret lives only in a gitignored
   `.env`. Never commit tokens, secrets, or JWTs.

9. **Record update IDs and offsets as engineering receipts.** `updateId` and
   `completionOffset` are your proof a submission committed — capture them.

10. **Test the real asset path early.** Standing up auth → party → preapproval →
    funding took real debugging. Prove the settlement path before demo day, not
    on it.

## Why this ties back to the product

Getting real Canton Coin into a real party made the core thesis concrete:

> **Tokenised assets alone are insufficient.**

Autonomous economic actors need explicit, enforceable answers to:

- **WHO** may act?
- **ON BEHALF OF WHOM?**
- **HOW MUCH?**
- **TO WHOM?**
- **FOR WHAT?**
- **UNTIL WHEN?**
- **WHO CAN REVOKE?**
- **WHAT IS AUDITABLE?**

This is exactly the problem **Canton Agent Mandate** addresses: the ledger, not
the model or the backend, answers these questions and enforces the answers.
