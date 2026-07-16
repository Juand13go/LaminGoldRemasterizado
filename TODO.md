# TODO / Known Gaps

Updated after the pass that fixed the register/login bug, closed the Spanish-accents
sweep, added image-upload validation + rate limiting, and ran the full
register -> login -> cart -> checkout and admin-product-creation flows live through a
real browser via Playwright (previously unrun). `npm run lint`, `typecheck`, `test`
(32 unit tests), and `build` all pass.

Priority: **P0** = blocks going live / real bug, **P1** = should fix before trusting it
in production, **P2** = tech debt / nice-to-have, safe to defer.

## Needs you specifically (no CLI/dashboard access available in-session)

- **[P0] Vercel project not created/connected yet.** `vercel whoami` requires an
  interactive device-code login (visit a URL, confirm in browser) that couldn't be
  completed unattended. Run `npx vercel link` (and `vercel --prod` to deploy) yourself.
- **[P0] Env vars not set in Vercel.** Same blocker as above — add
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `CART_COOKIE_SECRET`, `NEXT_PUBLIC_WHATSAPP_NUMBER`
  under Project Settings -> Environment Variables once the project exists.
- **[P1] Supabase Auth "Site URL" / "Redirect URLs" still point at localhost.** This
  no longer blocks login or registration (see "Fixed this pass" below), but will bite
  the moment a password-reset or magic-link flow is added, since neither exists yet.
  Update it in the dashboard (Authentication -> URL Configuration) before adding either.
- **[P1] `NEXT_PUBLIC_WHATSAPP_NUMBER` is the legacy hardcoded number
  (`573160438565`), copied as-is.** Confirm this is really the number that should
  receive production orders before launch.
- **[P1] GitHub Actions CI has never been confirmed green.** `gh` CLI isn't installed
  in this environment — check the Actions tab on GitHub directly.
- **[P1] `scripts/migrate-from-appwrite.ts` has never been run or tested**, against
  real Appwrite data or otherwise — no Appwrite credentials were available this
  session either. Run with `--dry-run` first against real data before trusting it.

## Fixed this pass

- **Register -> login bug (the reported critical bug).** Root cause: Supabase Auth's
  "Confirm email" setting was on, the confirmation email's redirect pointed at
  localhost (see above), and the app had no fallback — new accounts were created but
  stuck `email_confirmed_at: null` forever, with no error shown to the user. Fixed by
  having `registerAction` (`app/actions/auth.ts`) create accounts via
  `admin.auth.admin.createUser({ email_confirm: true })` and sign the user in directly,
  skipping email confirmation entirely rather than depending on dashboard config —
  reasonable for a small storefront with low signup volume. The two real accounts that
  were stuck unconfirmed from earlier manual testing
  (`ramirezrendonjuandiego@gmail.com`, `ramirezrendonjuandiego1@gmail.com`) were
  retroactively confirmed via the admin API so they aren't left behind.
- **Missing accents/ñ across the UI** — swept `app/`, `lib/`, and `components/`
  (labels, flash messages, Zod error strings, a few CSS comments).
- **No server-side validation on uploaded product images** — `app/actions/
  admin-products.ts` now checks a 5MB size cap and sniffs the real file format from
  magic bytes (jpg/png/webp) instead of trusting the client-supplied `File.type`.
- **No rate-limiting on login/register/checkout** — added a Postgres-backed sliding
  window limiter (`check_rate_limit` RPC + `rate_limits` table,
  `supabase/migrations/0006_rate_limit.sql`, wired up via `lib/rate-limit.ts`).
  Deliberately Postgres-backed rather than in-memory since Vercel serverless functions
  don't share memory across invocations. Applied to the live project and verified live
  (direct RPC calls confirmed it allows N attempts then blocks, as designed).
- **Full checkout flow, register flow, and admin product creation were "never
  exercised through a real browser"** — all three now have Playwright specs
  (`tests/e2e/checkout.spec.ts`, `tests/e2e/register.spec.ts`,
  `tests/e2e/admin-products.spec.ts`) that were actually run against a real Chromium
  browser and pass. Browsers are now installed (`npx playwright install chromium`).
  Two real bugs in the test setup were found and fixed along the way: form labels
  weren't associated with their inputs (`htmlFor`/`id` added across login/register/
  checkout — also a real accessibility fix, not just a test workaround), and the
  checkout spec had a race condition (navigated to `/carrito` before the add-to-cart
  Server Action's background request had finished).
- A dedicated confirmed test account exists for CI/local e2e runs:
  `e2e-fixture@laminogold.test` / `E2eFixture123!` (used as `TEST_USER_EMAIL`/
  `TEST_USER_PASSWORD`). The register and admin-product specs create and clean up
  their own throwaway accounts per run instead of relying on a fixed fixture.

## Never exercised through a real browser

- **[P2] Theme toggle (dark/light mode)** — ported from legacy CSS/script, never
  visually checked in a browser.
- **[P2] Responsive/mobile layout** — trusted the ported CSS's existing media
  queries, never checked in an actual mobile viewport.

## Testing gaps

- **[P2] Vitest coverage is limited to pure logic**: cart math, the WhatsApp message
  builder, the cart cookie signing, and Zod schemas. No test exercises a Server
  Action, an RLS policy, or the `create_order`/`create_product_with_variant` RPCs
  directly against a (test) Supabase instance.
- **[P2] No e2e coverage for category creation or order status update** — admin
  product creation is now covered (see above), but those two admin flows still only
  have the one-off manual bootstrap script.

## Security / robustness

- **[P2] Deleting a product doesn't clean up its Storage file** — the DB row is
  removed but the uploaded image stays in the `product-images` bucket forever
  (orphaned files accumulate over time).
- **[P2] No error boundary / branded 500 page.** An uncaught runtime error (e.g. a
  Supabase outage) currently falls back to Next's default error page.

## Admin panel gaps (by design, but worth confirming you're OK with them)

- **[P2] No category "edit"**, only create/delete — matches the scope we agreed on,
  but flagging in case you want rename support later.
- **[P2] No pagination** on the admin orders list (`limit(50)`) or the public catalog
  (no limit at all) — fine at current scale, will need addressing once the catalog
  or order history grows.
- **[P2] Order confirmation page** (`/pedido-confirmado?order=<uuid>`) takes the order
  id as a public query param. RLS already restricts the underlying row to its owner
  or an admin, so a guessed id just 404s — not a vulnerability, but an unusual enough
  pattern to double check you're comfortable with it.

## Code/schema tech debt

- **[P2] `types/database.ts` is hand-written**, not generated by
  `supabase gen types typescript`. It can drift silently if the schema changes
  without updating it manually (there's a comment at the top of the file as a
  reminder, but nothing enforces it).
- **[P2] No SEO basics** — no `robots.txt`, `sitemap.xml`, or Open Graph metadata.
  Fine for an MVP, a gap for a real public storefront.
- **[P2] Flash messages are carried via `?type=&msg=` query params**, which means
  they persist across a page refresh/reload and show up in browser history. Minor
  UX nit, not a functional bug.

## Content

- **[P1] Only one test product exists** ("Pulsera Oro Laminado Clasica (prueba)").
  The real catalog still needs to be created, either by hand through `/admin/products`
  or via the (unrun) Appwrite migration script.
