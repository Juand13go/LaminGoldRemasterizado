import path from "node:path";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.skip(
  !supabaseUrl || !serviceRoleKey,
  "NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not configured"
);

// Covers the one browser-driven gap flagged in TODO.md: admin product creation via a
// real multipart <form> file upload, which is a different code path than the Node
// scripts previously used to test the Storage upload + create_product_with_variant RPC.
// Creates and tears down its own throwaway admin account + product + storage file.
test("admin can create a product with an image via the real form", async ({ page }) => {
  const admin = createClient(supabaseUrl!, serviceRoleKey!);
  const email = `pw-admin-${Date.now()}@laminogold.test`;
  const password = "PlaywrightAdmin123!";
  const productName = `Playwright Test Product ${Date.now()}`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("user not created");

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", created.user.id);
  if (roleError) throw roleError;

  try {
    await page.goto("/login");
    await page.locator("#loginEmail").fill(email);
    await page.locator("#loginPass").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/catalogo/);

    await page.goto("/admin/products/new");
    await page.locator('input[name="name"]').fill(productName);
    await page.locator('input[name="price"]').fill("99000");
    await page.locator('select[name="category_id"]').selectOption({ index: 1 });
    await page
      .locator('input[name="image_file"]')
      .setInputFiles(path.join(__dirname, "fixtures", "test-product.png"));

    await page.getByRole("button", { name: "Crear producto" }).click();

    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByText(productName)).toBeVisible();
  } finally {
    const { data: product } = await admin
      .from("products")
      .select("id, image_url")
      .eq("name", productName)
      .maybeSingle();

    if (product) {
      if (product.image_url) {
        const storagePath = product.image_url.split("/product-images/")[1];
        if (storagePath) await admin.storage.from("product-images").remove([storagePath]);
      }
      await admin.from("products").delete().eq("id", product.id);
    }

    await admin.auth.admin.deleteUser(created.user.id);
  }
});
