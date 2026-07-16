import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Best-effort cleanup so this test doesn't leave a throwaway account behind in the
// live project's Auth > Users list on every run. Silently skipped if the service role
// key isn't available to the test runner (e.g. a stripped-down CI env) — that's a
// cleanliness nice-to-have, not a reason to fail the test itself.
async function deleteTestUser(email: string): Promise<void> {
  if (!supabaseUrl || !serviceRoleKey) return;
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
}

// Exercises the actual bug this was written to catch: a brand-new account must be able
// to log in immediately after registering, with no email-confirmation step in the way
// (see app/actions/auth.ts — registerAction uses admin.createUser + email_confirm: true
// and signs the user in directly). Runs unconditionally (no env fixtures needed) since
// it creates its own throwaway account per run.
test("register creates an account that can log in immediately, no email confirmation needed", async ({
  page,
}) => {
  const email = `pw-register-${Date.now()}@laminogold.test`;
  const password = "PlaywrightTest123!";

  try {
    await page.goto("/register");

    await page.locator("#regFullName").fill("Playwright Register Test");
    await page.locator("#regEmail").fill(email);
    await page.locator("#regPhone").fill("3000000000");
    await page.locator("#regCity").fill("Medellin");
    await page.locator("#regAddress").fill("Calle de prueba 123");
    await page.locator("#regPass1").fill(password);
    await page.locator("#regPass2").fill(password);

    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // registerAction signs the new user in and redirects straight to /catalogo (or
    // `next`) — if this instead lands on /login it means the account was created but
    // left unconfirmed, which is exactly the bug this test guards against.
    await expect(page).toHaveURL(/\/catalogo/);

    // Confirm the session actually stuck: log out, then log back in with the same
    // credentials.
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/login");
    await page.locator("#loginEmail").fill(email);
    await page.locator("#loginPass").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/catalogo/);
  } finally {
    await deleteTestUser(email);
  }
});
