# Token transfers on DevNet

How Canton Coin (Amulet) actually moved, and the funding of `colin-agent`.

## Holdings are an interface

A party's balance is not a number — it is a set of `Holding` contracts. Holdings
are read through the token-standard **`Holding` interface**, not a concrete
template, so a template filter matches nothing and returns an empty list (which
looks exactly like a zero balance). Each holding has an `amount`, an
`instrument` (`Amulet` = Canton Coin), an `admin` (the DSO), and a `locked` flag;
only unlocked holdings are spendable.

## DSO and registry

- **DSO** (the Amulet admin party):
  `DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a`
- **Registry (working):** `https://sv-proxy.dev.digik.cantor8.tech`

The registry serves the transfer factory and the disclosed contracts a transfer
needs (privacy means you cannot see the issuer's config contracts directly, so
they are handed over as disclosed contracts for a single transaction).

Note: `c8lab.dso_party()` **failed to discover** the DSO on the shared DevNet.
For debugging we supplied the known DSO explicitly rather than relying on
discovery.

## Transfer preapproval

To receive direct transfers, a party needs a live `TransferPreapproval`. We
submitted a `TransferPreapprovalProposal`:

- **provider:** the validator operator
  (`cantor8-digik-1::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f`)
- **receiver:** `colin-agent`
- **expectedDso:** the DSO above

Engineering receipts:

```
updateId          1220ad507b5262fafcecd0b515c5ff1f47d10d392b93cc4b5ee07aede1c5fbeb9d29
completionOffset  2920631
```

## Proposal → auto-accept, and the stale-offer trap

A proposal is accepted by the provider's automation a moment later — but that
**auto-accept was live for FUTURE offers, not historical ones** (per Davide from
the Cantor8 team). An earlier transfer therefore required manual handling. By the
time its old instruction was queried manually, the registry returned:

```
AmuletTransferInstruction ... not found
```

**Lesson:** don't try to resurrect a stale instruction. Issue a fresh transfer
into the now-working preapproval path instead.

## Final successful funding

With the preapproval path working, `colin-agent` was funded with **10 CC**. The
exact-party holdings query returned:

```
Holding 1:  amount 5.0000000000  instrument Amulet  admin <DSO>  locked false
Holding 2:  amount 5.0000000000  instrument Amulet  admin <DSO>  locked false
Total: 10 CC
```

Two holdings rather than one is normal — a balance is a set of UTXO-like
contracts.

## The real 1 CC transfer offer (newest state)

A permitted Daml mandate decision was then used to create a **real Token Standard
transfer** of 1 CC from `colin-agent` to a real `greenfeed` party:

```
sender               colin-agent
receiver             greenfeed
before spendable     10 CC
after spendable      9 CC
locked in offer      1 CC
transferKind         offer
status               OFFER CREATED
```

The registry returned `transferKind: offer` (the receiver has no live preapproval
we control), so the 1 CC is now held in a **`TransferInstruction`** and shows as a
**locked** 1 CC holding on the sender, with the remaining 9 CC spendable. This is
a real ledger state change, verified by re-querying holdings before and after.

**Acceptance is pending — no final settlement.** Attempting to accept the
instruction on behalf of `greenfeed` returned an `HTTP 404` from the registry's
`.../transfer-instruction/v1/<cid>/choice-contexts/accept` endpoint. So the 1 CC
is committed into an offer but **`greenfeed` has not received it**. An `offer` is
not final settlement. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for the
registry choice-context lesson.

## The `farmfort2` experiment: visibility ≠ authority

An old hackathon party remained visible:

```
farmfort2::1220f67dbd62e241ed9d1936ceb879ec06a122cf64999a58a7f5e1838e1a1e0faaf2
```

It still showed **one unlocked Holding of 20 Amulet**. Attempting to send 5 from
it failed with:

```
NO_SYNCHRONIZER_ON_WHICH_ALL_SUBMITTERS_CAN_SUBMIT
```

identifying `farmfort2` as `unknownSubmitter`. This proves an important
distinction:

> Historical holdings may remain **visible** even when the current participant
> **cannot submit** as that party on a connected synchronizer.

The failed transaction did **not** move those funds.

## Honesty boundary

Authorisation (the Daml Agent Mandate) and settlement (the Amulet transfer) are
**separate steps** here, not a single atomic ledger transaction. We do **not**
claim atomic authorisation + settlement, and we do **not** claim final
settlement: a real 1 CC transfer **offer** exists (1 CC locked, 10 → 9 CC), but
receiver acceptance is pending, so `greenfeed` has not received the 1 CC.
