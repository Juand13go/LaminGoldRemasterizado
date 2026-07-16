# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandate for this project

Lamin Gold is being rewritten from its current implementation (Flask/Python + Jinja2 + Appwrite, ~8 months old, working in production) onto a new stack: **Next.js on Vercel + Supabase**. This is a full rewrite, not a refactor — you have full authority over implementation decisions within the constraints below. The old Flask app (kept in this repo's history / a reference branch) is the source of truth for business logic and data shape, not for technology choices.

**Why this stack:** the user's target deployment is Vercel, and Vercel's first-class runtime is Next.js/Node — keeping Flask would fight the platform. Supabase (Postgres + Auth + Storage + Row Level Security) is the natural pairing: a real relational database instead of Appwrite's document store, built-in auth instead of hand-rolled session/password logic, and a storage bucket with the same "upload + get URL" model the old app already used via Appwrite Storage.

**Do not change:**
- The visual design as currently rendered. Port the existing HTML/CSS (`templates/`, `static/css/`) to React components 1:1 — same look, same UX. Use CSS Modules (or plain global CSS ported as-is, scoped where needed) rather than introducing Tailwind or a redesign; do not restyle anything the user hasn't asked you to touch.
- The checkout flow ending in a WhatsApp handoff. No payment gateway is being added. Port `services/order_service.py`'s WhatsApp message/link construction faithfully.
- The core business rules already encoded in the old app: guest users can browse/add to cart without an account; login is required only at checkout; roles are `buyer` / `admin`; order items snapshot product name/price/variant at time of purchase (don't join live product data for historical orders).

**Must do, as the primary goal of this rewrite:**
- **Stack:** Next.js (App Router, TypeScript), deployed on Vercel. Supabase for Postgres, Auth, and Storage. Use `@supabase/ssr` for server-side data access (Server Components for reads, Server Actions or Route Handlers for mutations) — do not build a separate REST API layer unless something genuinely needs it.
- **Schema:** design a proper relational Postgres schema replacing the old Appwrite collections (`models/constants.py`: `users`, `products`, `product_variants`, `product_images`, `orders`, `order_items`, `settings`). Use real foreign keys and constraints — the old app faked relations in application code (e.g. joining `products` to `product_images` manually in Python); Postgres should enforce this natively.
- **Auth:** Supabase Auth (email/password) replaces the custom `werkzeug`-hashed, session-cookie auth in `services/user_service.py` / `routes/auth_guard.py`. Store `role` (`buyer`/`admin`) in a `profiles` table keyed to `auth.users.id`, and enforce admin-only access via Row Level Security policies, not just page-level checks.
- **Row Level Security:** every table must have RLS enabled with explicit policies (e.g. a user can read their own orders; only `admin` role can write products). Do not rely on application-code checks alone the way the old Flask `is_admin()` guard did.
- **Storage:** Supabase Storage bucket for product images, replacing Appwrite's bucket. Match the old behavior of `services/product_images_service.py` (upload file, get a stable public/signed URL, link it to a product).
- **Cart:** guest-friendly cart with no login required, matching current UX. Implement via a signed cookie or local storage synced through a Server Action — do not require an account to add items to cart, only at checkout (same as today).
- **Validation:** Zod schemas at the Server Action / Route Handler boundary for all form input (auth, checkout, admin product/order forms) — this replaces the old manual `.strip()`/if-checks scattered through Flask routes.
- **Testing:** Vitest for unit tests (business logic: cart totals, order creation, validation schemas) and Playwright for critical e2e flows (browse → add to cart → checkout → WhatsApp link generated). There were no tests in the old app — build this in from the start rather than retrofitting later.
- **CI:** GitHub Actions running lint (`next lint` / ESLint), typecheck (`tsc --noEmit`), and tests on every PR. Vercel's own preview deployments handle build verification per-PR on top of this.
- **Data migration:** write a one-off Node migration script (not part of the app) that reads from Appwrite (SDK, using the existing `.env` credentials) and writes into Supabase: products + product_variants, product_images (re-upload the actual files into Supabase Storage, don't just copy URLs), orders + order_items, and users. **Password hashes cannot be migrated as-is** — Appwrite/the old app's password hashes are not compatible with Supabase Auth's hashing. Either force a password reset flow for all existing users post-migration, or invite them via Supabase's invite/magic-link flow. Flag this tradeoff to the user before running the migration; don't silently drop passwords or silently create accounts with unusable credentials.

When in doubt about a tradeoff, prefer idiomatic Next.js/Supabase patterns over literally translating Flask patterns — the goal is code that looks like it was built for this stack, not a Python app transliterated into TypeScript.

## Commands

- Dev server: `npm run dev` (Next.js on http://localhost:3000)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Unit tests (Vitest): `npm run test` — single test: `npx vitest run tests/unit/cart-math.test.ts -t "computes subtotal"`
- E2e tests (Playwright): `npm run test:e2e` — needs `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` env vars for a pre-confirmed account, and at least one seeded active product; skips itself otherwise
- Apply/update the Postgres schema: from `supabase/migrations/*.sql`, either paste them into the Supabase SQL editor in order, or `npx supabase link --project-ref <ref>` then `npx supabase db push` (needs the project's DB password)
- Regenerate `types/database.ts` after a schema change: `npx supabase gen types typescript --project-id <ref> > types/database.ts` (re-add the two RPC function return types if the generator drops them — see the comment at the top of that file)
- One-off Appwrite -> Supabase data migration (not part of the app): copy `scripts/.env.example` to `scripts/.env`, fill in Appwrite creds, then `npm run migrate:appwrite -- --dry-run` first, then for real `npm run migrate:appwrite` (add `--send-invites` to also email migrated users a set-password link — see the tradeoff notes at the top of `scripts/migrate-from-appwrite.ts`)

## Reference: what the old app actually does

The previous implementation (Flask) is documented here so its behavior can be ported accurately — not as guidance on how the new app should be structured.

**Routing surface:** public catalog (`/`, `/catalogo`, `/categoria/<slug>`, `/producto/<id>`), cart (`/carrito` + add/update/remove/clear actions), auth (`/login`, `/register`, `/logout`), checkout (`/checkout`, login-gated), admin (`/admin/*`, role-gated: dashboard, product CRUD, order status updates).

**Fixed categories:** the old app hardcodes four categories in `routes/shop.py` (`pulseras`, `cadenas`, `anillos`, `aretes`) with slug/label/title/description — these are not admin-editable. Confirm with the user whether categories should become a real editable table in the new schema or remain a fixed set encoded in the app.

**Product-image relationship:** a product's image is not a column on the product; it's resolved via a separate `product_images` join keyed by `product_id`, and the URL is built by hand from an Appwrite storage endpoint pattern. In the new schema this should likely just be a column (or a proper one-to-many table if multi-image support is wanted) pointing at a Supabase Storage path.

**Order creation:** on checkout, the old app (`services/order_service.py`) either uses the logged-in user's ID or creates/updates a `users` document from the checkout form (name/phone/email/city/address), creates one `orders` row, creates one `order_items` row per cart line with price/name snapshotted at purchase time, clears the cart, and builds a `wa.me` link (business number hardcoded as `WHATSAPP_NUMBER`) with an itemized message for the customer to send.

**Order statuses:** `nuevo`, `contactado`, `en_proceso`, `enviado`, `entregado`, `cancelado` — managed by admin via `update_order_status()`.

**Known bugs/smells in the old app worth knowing about (don't reintroduce):** two parallel Appwrite access patterns (SDK vs. hand-rolled REST) that the old code itself flags as unreliable in comments; no CSRF protection anywhere; hardcoded insecure `SECRET_KEY` fallback; unpinned dependencies; broad `except Exception` blocks that silently swallow errors (e.g. a real DB outage looks identical to "no products exist").