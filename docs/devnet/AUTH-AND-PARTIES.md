# Auth and parties

How authentication and submission authority actually work on the Cantor8 DevNet,
and the debugging that got command submission working.

## Keycloak client credentials

DevNet uses Keycloak with the OAuth `client_credentials` grant. The toolkit
(`c8lab.py`) exchanges a client id + secret at the IDP for an access token, then
sends it as `Authorization: Bearer <token>` on every Ledger API call.

- IDP: `https://auth.dev.digik.cantor8.tech`
- Ledger API: `https://api.validator.dev.digik.cantor8.tech/api/ledger`

**Never commit the client secret.** It lives only in `.env` (gitignored).

## The JWT-subject discovery (the key unlock)

Decoding the issued access token revealed:

```
sub       = validator-backend@clients
client_id = hackathon
azp       = hackathon
```

The toolkit originally defaulted `C8_USER=ledger-api-user`. On this DevNet that
caused submission / rights problems, because `c8lab.submit()` sends
`userId = <C8_USER>` while the Keycloak token has a **fixed subject**
(`validator-backend@clients`). When the submit `userId` does not match the
token's identity, the ledger will not grant the rights you expect.

**Working configuration:**

```
C8_USER=validator-backend@clients
```

## The critical relationship

```
JWT subject
    =
Ledger submit userId
    =
Ledger identity granted CanActAs
```

All three must be the **same identity**. Once they were aligned, we granted
`CanActAs` for `colin-agent` to `validator-backend@clients`, and command
submission worked.

## Identity ≠ party

This is the lesson worth keeping:

- **Authentication** proves *which API identity* is making the request (the
  Keycloak subject / ledger user).
- **Authority** (`CanActAs`) is a *separate grant* that lets that identity submit
  **as a Canton party**.

A valid token does not imply you may act as any given party. For autonomous-agent
systems this separation is exactly right: service identity and delegated
financial authority must not be conflated.

## Exact party IDs (verified)

```
agent      colin-agent::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f
DSO        DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a
validator  cantor8-digik-1::12204e94c0e449c0efcd270dd1e68259c36471cebef132e5c7dfc2750fe8c9eed77f
```

## Avoid participant-wide party enumeration

The shared DevNet had roughly **5,784 local parties**. `c8lab.find_party()` →
`local_parties()` → `parties()` scans them all, which is extremely slow and can
hang. The CLI accept command using the hint `"colin-agent"` hit this path and had
to be interrupted.

**Recommendation:** once the full Party ID is known, use the full identifier
directly and avoid broad enumeration.

## Safe environment example

Fill these in a gitignored `.env` (see the repo root `.env.example`). Never put
the real secret in any tracked file:

```bash
export C8_BASE=https://api.validator.dev.digik.cantor8.tech/api/ledger
export C8_IDP=https://auth.dev.digik.cantor8.tech
export C8_CLIENT_ID=hackathon
export C8_CLIENT_SECRET=<REDACTED — from the Cantor8 team, never commit>
export C8_REGISTRY=https://sv-proxy.dev.digik.cantor8.tech
export C8_USER=validator-backend@clients
```
