# Lock In - Current State

_Last updated: 2026-05-10 by Claude (audit + restore pass)_

App: <https://lockin-production-1278.up.railway.app>
Repo: <https://github.com/zackarooso/lockin>
Railway project: `db416aed-0787-4397-81b4-638c4d5a8252` (service `1e616731-647c-4d44-83f8-1d9dfd86a9ca`)

## Deploy

- **Status:** ACTIVE, builds clean on every push to `main`
- **Last good commit:** see git log
- **Stack:** Next.js 14.2.35, React 18, PostgreSQL (Railway), JWT via `jose`, no client UI lib
- **Build config:** `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` are set in `next.config.js` because the codebase has some loose `any` typing. Keep these on until types are tightened, or strict mode will block deploys.

## What works (verified in browser)

- Phone-based auth (`/auth`) -> name capture -> session cookie (`lockin_session`, JWT, 90d)
- Home feed (`/`) with: NET POSITION strip, vote-needed section, invites section, active bets, recent settled
- Create bet (`/create`) — self or mutual, with proof toggles, stake, deadlines
- Bet detail (`/bet/[id]`) — pools, participants, join flow, copy invite link, back nav
- Voting (`/bet/[id]/vote`) — yes/no/nullify, subject blocked from voting
- Scorecard (`/scorecard`) — net position, wins, losses, IRL settle button on ledger entries
- Auto-transition: bets with `end_time < NOW()` flip from `open`/`active` to `voting` on the next DB read (see `autoTransitionToVoting` in `lib/db.ts`)
- **Creator actions on bet detail page (NEW):**
  - "MOVE TO VOTING NOW" — for open/active bets, forces status to voting
  - "FINALIZE WITH N VOTES" — for voting bets, runs `settleBet` with current votes
  - "NULLIFY BET" — sets status to nullified with reason "Closed by creator"
  - Backed by `POST /api/bets/close` (creator-only, 403 otherwise)

## Status state machine

```
open    -- someone joins -->   active
open/active  -- end_time passes -->  voting   (auto, or creator force)
voting  -- all eligible voted, or creator finalize -->  settled | nullified
any (creator) -- nullify -->  nullified
```

`settleBet` rules: majority side wins; ties (`yes === no` with votes) or majority-nullify -> nullified.

## What is NOT wired

- **Twilio SMS** — invite links are copy/paste only. No SMS goes out. `/api/bets/create` does not call Twilio. Add `TWILIO_*` env vars and an SMS adapter if you want this.
- **Proof submissions UI** — DB table `proof_submissions` exists, but there is no upload UI yet
- **Push notifications** — none
- **Real money** — by design. `ledger_entries` is a scorecard for IRL debts only

## Important repo rules

1. **DO NOT** run find/replace scripts that strip unicode. The codebase uses `'\u{1F9A9}'` and `'\u23F0'` style escapes specifically to survive that. Edit files directly.
2. JSX should not contain raw emoji literals. Use unicode escapes in JS strings interpolated into JSX.
3. `JWT_SECRET` must stay stable across deploys (already set in Railway) or every user gets logged out.
4. `DATABASE_URL` is wired to the Postgres plugin via `${{Postgres.DATABASE_URL}}` — do not hardcode.
5. Next.js floor is **14.2.35**. Below that there is a known critical CVE.

## Key files

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Home feed (NET POSITION, vote-needed, invites, active, settled) |
| `app/bet/[id]/page.tsx` | Bet detail + join + creator actions |
| `app/bet/[id]/vote/page.tsx` | Vote UI for participants |
| `app/create/page.tsx` | Create bet form |
| `app/scorecard/page.tsx` | Personal P&L + IRL settle |
| `app/auth/page.tsx` | Phone -> name auth |
| `app/layout.tsx` | App shell, header, desktop block |
| `components/BottomNav.tsx` | Feed / FAB / Score |
| `lib/db.ts` | All DB queries, `initDb`, `settleBet` |
| `lib/auth.ts` | JWT sign/verify, cookie helpers |
| `app/api/me/route.ts` | Returns user + bets + ledger |
| `app/api/bets/create/route.ts` | Create bet |
| `app/api/bets/[id]/route.ts` | Get bet + votes + proofs |
| `app/api/bets/join/route.ts` | Add participant |
| `app/api/bets/vote/route.ts` | Cast vote, auto-settle when all voted |
| `app/api/bets/close/route.ts` | Creator: force voting / finalize / nullify (NEW) |
| `app/api/bets/settle/route.ts` | Mark a ledger entry as IRL-settled |

## Test users (Railway prod DB)

Just sign in with any phone number on `/auth`. There is no SMS verification — anyone can claim any phone. This is intentional for the alpha.

## Next likely TODOs

1. Wire Twilio (or any SMS provider) into bet create + invites
2. Build proof submission UI (photo upload, geo capture)
3. Add real phone verification before going to public beta
4. Tighten types and remove the `ignoreBuildErrors` escape hatches
5. Add a "my closed bets" filter on scorecard
