# DevNet troubleshooting

Every error we actually hit on the Cantor8 DevNet, and what fixed it.

| Symptom | Cause | Fix / Lesson |
|---|---|---|
| `CERTIFICATE_VERIFY_FAILED` from Python urllib | Local machine's cert chain couldn't verify the DevNet TLS chain | Point urllib at certifi's bundle: `export SSL_CERT_FILE=$(python3 -m certifi)`. **Environment-specific workaround, not a Canton requirement.** |
| 403 / command submission rejected with a valid token | Submit `userId` (from `C8_USER`, defaulting to `ledger-api-user`) didn't match the Keycloak token subject | Decode the JWT; set `C8_USER` to the token `sub` (`validator-backend@clients`), then grant `CanActAs` to that identity. See [AUTH-AND-PARTIES.md](AUTH-AND-PARTIES.md). |
| `find_party()` slow / hangs, had to be interrupted | Shared DevNet has ~5,784 local parties; hint lookup enumerates and scans them all | Use the **full Party ID** directly; avoid participant-wide enumeration. |
| `dso_party()` fails to find the DSO | Discovery didn't resolve the DSO on the shared DevNet | Supply the known DSO explicitly for debugging rather than relying on discovery. |
| `AmuletTransferInstruction ... not found` | A stale/historical transfer instruction was queried after the fact; auto-accept applied only to future offers | Don't resurrect stale instructions — issue a **fresh** transfer into the working preapproval path. |
| `NO_SYNCHRONIZER_ON_WHICH_ALL_SUBMITTERS_CAN_SUBMIT` (`unknownSubmitter`) | Trying to submit as a party the current participant does not host on a connected synchronizer (the old `farmfort2` party) | Only submit as parties this participant can act for. Visibility of a holding ≠ authority to spend it. Funds were not moved. |
| `holdings` returns `[]` | Query succeeded; the party may simply be unfunded — **or** a template filter was used where the `Holding` **interface** filter is required | An empty array is not an error. Confirm auth + party first; use the interface filter; the party may just need funding. |
| Holding visible but transfer fails | Historical holding still shows in reads, but the participant can't submit as that party | Same as `unknownSubmitter` above: visibility does not imply submission authority. |
| Transfer offer exists but **accept** returns `HTTP 404` from `.../transfer-instruction/v1/<cid>/choice-contexts/accept` | The registry choice-context needed to accept the `TransferInstruction` isn't served for this instruction/registry on DevNet | **Remaining integration boundary.** The 1 CC transfer **offer** is real (1 CC locked, 10 → 9 CC), but receiver acceptance is not yet completed — an `offer` is not final settlement. Fetching a valid choice-context (registry `accept`) is part of Token Standard execution and is the next step to resolve; the coin can also be returned by withdrawing the offer. |
