# SettleMe

> The verified diaspora life OS. For people who moved countries.

One AI agent. One verified community trust layer. One identity graph that knows you. Across every surface you need in your new country — banking, visa, taxes, housing, schools, healthcare, events, community.

Beachhead: **Indians in Dubai**. Next: every corridor where the diaspora is dense, the WTP is high, and the local internet is broken.

---

## What's in this repo

| Surface | Where |
|---|---|
| Native app (iOS + Android + web) | Expo SDK 54 + expo-router + NativeWind |
| Auth + onboarding | Email magic-link → corridor → arrival → visa → family → verify |
| Six tabs | Home · Ask (AI agent) · Community · Events · Trusted · You |
| AI agent | Streams Claude Opus 4.7 via a Supabase edge function. Identity-graph-aware. Prompt-cached. Q&A retrieval anchored to your corridor. |
| Backend | Supabase (Postgres + RLS + Storage + Edge Functions) |
| Seed data | 10 founding sub-communities for Indians in Dubai, 7 upcoming events, 7 vetted vendors, 4 Q&A entries |

```
app/                      expo-router routes (auth, onboarding, tabs)
src/
  components/ui/          design system primitives
  features/               agent, community, events, trusted, profile, premium
  lib/                    supabase client, agentStream, queryClient, haptics
  state/                  zustand stores (identity, onboarding)
  theme/                  brand tokens
supabase/
  migrations/             schema (init + RLS)
  seed.sql                founding seed
  functions/agent-stream  Claude streaming edge function
```

---

## Run locally

### 1. Prereqs

- Node 22+, npm 11+
- Xcode (iOS) and / or Android Studio
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- An **Anthropic API key** for Claude

### 2. Install

```bash
npm install
```

### 3. Wire up a Supabase project

**Local (recommended for dev):**

```bash
supabase start                 # spins up local Postgres + Studio
supabase db reset              # applies migrations + seed
```

**Hosted:**

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push               # applies migrations
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 4. Set environment variables

```bash
cp .env.example .env.local
cp supabase/.env.example supabase/.env.local
```

`.env.local` (client-side, prefixed `EXPO_PUBLIC_`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_AGENT_FN_URL=https://<project>.functions.supabase.co/agent-stream
```

`supabase/.env.local` (server-side, edge function only):

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 5. Serve the edge function

```bash
npm run supabase:serve          # local agent-stream at :54321
```

For production:

```bash
supabase functions deploy agent-stream
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 6. Run the app

```bash
npm start                       # press i (iOS), a (Android), w (web)
```

---

## How the AI agent works

User taps **Ask** → opens a Claude conversation streaming over SSE from a Supabase edge function.

The function:

1. Authenticates the request with the user's Supabase JWT.
2. Loads the user's **profile** + **identity graph** (corridor, city, visa, family).
3. Retrieves matching **Q&A** entries by keyword overlap (swap to pgvector when ready).
4. Composes the prompt as:
   - Static SettleMe system prompt (cached via `cache_control: ephemeral`).
   - Dynamic identity block + Q&A (cached separately).
   - Last 12 messages of thread history.
5. Streams Claude Opus 4.7 with **adaptive thinking** back to the device.
6. Persists user message + final assistant message to `ai_messages`.

Model ID, system prompt, and retrieval logic live in `supabase/functions/agent-stream/index.ts`.

---

## What's stubbed and needs ownership

| Area | Where | Next step |
|---|---|---|
| Premium billing | `src/features/premium/PaywallSheet.tsx` + `profile.tsx` | Wire Stripe (web) + RevenueCat / native IAP. `subscriptions` table is ready. |
| Passport verification | `app/(onboarding)/verify.tsx` | Upload to Supabase Storage. Plug in Onfido / Persona or manual review. Set `profiles.verified_at`. |
| Push notifications | not wired | Expo Notifications. Send on visa renewal proximity, event invites, community replies. |
| Pgvector Q&A | `supabase/functions/agent-stream/index.ts` | Replace keyword `overlaps()` with pgvector similarity. |
| App icons + splash | `assets/` | Drop in branded icon set. |
| EAS builds | EAS config | Configure for TestFlight + Play Internal. |

---

## Brand

- **Canvas** `#FBF8F2` — warm cream ground.
- **Ink** `#0B0F1A` — deep type.
- **Marigold** `#F4A227` — accent, hopeful.
- **Emerald** `#1F8E63` — trust, verified.
- **Terracotta** `#C8553D` — warmth, alerts.
- **Display** Georgia (Fraunces when fonts ship).
- **Body** system / SF Pro / Roboto.

---

## License

Proprietary. © 2026 SettleMe.
