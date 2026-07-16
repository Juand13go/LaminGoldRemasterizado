import { test, expect } from "@playwright/test";

// Needs the Supabase schema applied + at least one active product seeded, and a
// pre-existing confirmed test account (TEST_USER_EMAIL / TEST_USER_PASSWORD) since
// registration may require email confirmation depending on the project's auth settings.
// Skips itself when those env vars aren't set, rather than failing CI on missing fixtures.
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

test.describe("browse -> cart -> checkout -> WhatsApp handoff", () => {
  test.skip(!email || !password, "TEST_USER_EMAIL/TEST_USER_PASSWORD not configured");

  test("full golden path", async ({ page }) => {
    await page.goto("/catalogo");

    const firstCard = page.locator("article.card").first();
    await expect(firstCard).toBeVisible();
    const productName = await firstCard.locator(".card-title").textContent();

    await firstCard.getByRole("button", { name: "Agregar al carrito" }).click();
    // addToCartAction has no redirect(), so the click just triggers a background RSC
    // fetch — wait for the navbar badge (revalidated by the action) before navigating
    // away, otherwise goto("/carrito") can race the cart cookie actually being set.
    await expect(page.locator(".cartbtn__badge")).toBeVisible();

    await page.goto("/carrito");
    await expect(page.locator(".cart__name").first()).toHaveText(productName?.trim() ?? "");

    await page.getByRole("link", { name: "Ir a checkout" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/checkout/);

    await page.locator('input[name="full_name"]').fill("Playwright Test");
    await page.locator('input[name="phone"]').fill("3000000000");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="city"]').fill("Medellin");
    await page.locator('input[name="address"]').fill("Calle de prueba 123");

    await page.getByRole("button", { name: "Confirmar pedido" }).click();

    await expect(page).toHaveURL(/\/pedido-confirmado/);
    const waLink = page.getByRole("link", { name: "Enviar por WhatsApp" });
    await expect(waLink).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
  });
});
