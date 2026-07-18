/**
 * One-off data migration: Appwrite (legacy Flask app) -> Supabase (this app).
 *
 * NOT run as part of the app. Run manually, once, with:
 *   npm run migrate:appwrite
 *
 * Required env (scripts/.env, NOT committed):
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, APPWRITE_API_KEY,
 *   APPWRITE_BUCKET_PRODUCT_IMAGES
 * Required env (repo root .env.local, already present):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * IMPORTANT — password tradeoff (flagged per CLAUDE.md's migration mandate):
 * Appwrite/Flask password hashes cannot be migrated into Supabase Auth (incompatible
 * hashing schemes). This script creates each user with a random, unusable password and
 * DOES NOT email anyone by default. Pass --send-invites to also call
 * supabase.auth.admin.inviteUserByEmail() for every migrated user, which sends them a
 * real "set your password" email — do that deliberately, not as a side effect of a dry
 * run, since it contacts real customers.
 *
 * Run with --dry-run first to see counts/mappings without writing anything.
 * Pass --products-only to migrate only categories/products (skip users and orders
 * entirely) — useful when you want the catalog moved over without deciding yet how
 * to handle the password/invite tradeoff above.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { Client as AppwriteClient, Databases, Storage, Query } from "node-appwrite";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });
loadEnv({ path: path.resolve(__dirname, ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const SEND_INVITES = process.argv.includes("--send-invites");
const PRODUCTS_ONLY = process.argv.includes("--products-only");

const TABLE_USERS = "users";
const TABLE_PRODUCTS = "products";
const TABLE_PRODUCT_IMAGES = "product_images";
const TABLE_ORDERS = "orders";
const TABLE_ORDER_ITEMS = "order_items";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const appwrite = new AppwriteClient()
  .setEndpoint(requireEnv("APPWRITE_ENDPOINT"))
  .setProject(requireEnv("APPWRITE_PROJECT_ID"))
  .setKey(requireEnv("APPWRITE_API_KEY"));

const appwriteDb = new Databases(appwrite);
const appwriteStorage = new Storage(appwrite);
const appwriteDatabaseId = requireEnv("APPWRITE_DATABASE_ID");
const appwriteBucketId = requireEnv("APPWRITE_BUCKET_PRODUCT_IMAGES");

const supabase = createSupabaseClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function listAllAppwriteDocuments(collectionId: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const res = await appwriteDb.listDocuments(appwriteDatabaseId, collectionId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);
    all.push(...(res.documents as unknown as Record<string, unknown>[]));
    offset += res.documents.length;
    if (res.documents.length === 0 || offset >= res.total) break;
  }

  return all;
}

async function migrateCategoriesLookup(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("categories").select("id, slug");
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.slug, c.id]));
}

async function migrateProducts(categoryBySlug: Map<string, string>): Promise<Map<string, string>> {
  const products = await listAllAppwriteDocuments(TABLE_PRODUCTS);
  const images = await listAllAppwriteDocuments(TABLE_PRODUCT_IMAGES);

  const imageByProductId = new Map<string, string>();
  for (const img of images) {
    const pid = String(img.product_id ?? "");
    const fid = String(img.file_id ?? "");
    if (pid && fid && !imageByProductId.has(pid)) imageByProductId.set(pid, fid);
  }

  const oldToNewProductId = new Map<string, string>();

  for (const product of products) {
    const oldId = String(product.$id);
    const name = String(product.name ?? "Producto");
    const categorySlug = String(product.category ?? "").toLowerCase();
    const categoryId = categoryBySlug.get(categorySlug);

    if (!categoryId) {
      console.warn(`Skipping product ${oldId} (${name}): unknown category "${categorySlug}"`);
      continue;
    }

    let imageUrl: string | null = null;
    const fileId = imageByProductId.get(oldId);
    if (fileId) {
      if (DRY_RUN) {
        imageUrl = "(dry-run: would re-upload image)";
      } else {
        const bytes = await appwriteStorage.getFileDownload(appwriteBucketId, fileId);
        const storagePath = `migrated/${oldId}-${fileId}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, Buffer.from(bytes as ArrayBuffer), { upsert: true });
        if (uploadError) {
          console.warn(`Image upload failed for product ${oldId}: ${uploadError.message}`);
        } else {
          imageUrl = supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
        }
      }
    }

    const slug = `${categorySlug}-${oldId}`.toLowerCase();
    console.log(`Product ${oldId} -> ${name} [${categorySlug}]`);

    if (DRY_RUN) continue;

    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        name,
        slug,
        description: String(product.description ?? ""),
        color: String(product.color ?? "Dorado"),
        gold_type: String(product.gold_type ?? "18k"),
        image_url: imageUrl,
        is_active: Boolean(product.is_active ?? true),
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.warn(`Failed to insert product ${oldId}: ${error?.message}`);
      continue;
    }

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert({ product_id: inserted.id, price: Number(product.base_price ?? 0) });
    if (variantError) {
      console.warn(`Failed to insert variant for product ${oldId}: ${variantError.message}`);
    }

    oldToNewProductId.set(oldId, inserted.id);
  }

  return oldToNewProductId;
}

async function migrateUsers(): Promise<Map<string, string>> {
  const users = await listAllAppwriteDocuments(TABLE_USERS);
  const emailToNewUserId = new Map<string, string>();
  const migratedEmails: string[] = [];

  for (const user of users) {
    const email = String(user.email ?? "").trim().toLowerCase();
    if (!email) {
      console.warn(`Skipping user ${user.$id}: no email on file`);
      continue;
    }

    console.log(`User ${user.$id} -> ${email}`);
    if (DRY_RUN) continue;

    // Random, unusable password: the old Appwrite/werkzeug hash cannot be migrated,
    // so every account needs a real password reset or invite before it's usable.
    const temporaryPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: String(user.full_name ?? ""),
        phone: String(user.phone ?? ""),
        city: String(user.city ?? ""),
        address: String(user.address ?? ""),
      },
    });

    if (error || !data.user) {
      console.warn(`Failed to create Supabase user for ${email}: ${error?.message}`);
      continue;
    }

    if (String(user.role ?? "buyer") === "admin") {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    }

    emailToNewUserId.set(email, data.user.id);
    migratedEmails.push(email);

    if (SEND_INVITES) {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      if (inviteError) {
        console.warn(`Failed to send invite to ${email}: ${inviteError.message}`);
      }
    }
  }

  if (!DRY_RUN && !SEND_INVITES && migratedEmails.length > 0) {
    console.log("\n=== Users migrated without a usable password ===");
    console.log("Re-run with --send-invites to email them a set-password link, or trigger");
    console.log("Supabase's invite/magic-link flow manually for these addresses:");
    for (const email of migratedEmails) console.log(` - ${email}`);
  }

  return emailToNewUserId;
}

async function migrateOrders(
  productIdMap: Map<string, string>,
  userIdMap: Map<string, string>
): Promise<void> {
  const orders = await listAllAppwriteDocuments(TABLE_ORDERS);
  const orderItems = await listAllAppwriteDocuments(TABLE_ORDER_ITEMS);

  const itemsByOrderId = new Map<string, Record<string, unknown>[]>();
  for (const item of orderItems) {
    const orderId = String(item.order_id ?? "");
    if (!itemsByOrderId.has(orderId)) itemsByOrderId.set(orderId, []);
    itemsByOrderId.get(orderId)!.push(item);
  }

  for (const order of orders) {
    const oldOrderId = String(order.$id);
    const email = String(order.email ?? "").trim().toLowerCase();
    const userId = userIdMap.get(email);

    if (!userId) {
      console.warn(`Skipping order ${oldOrderId}: no migrated user for email "${email}"`);
      continue;
    }

    console.log(`Order ${oldOrderId} -> user ${email}`);
    if (DRY_RUN) continue;

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        full_name: String(order.full_name ?? ""),
        phone: String(order.phone ?? ""),
        email,
        city: String(order.city ?? ""),
        address: String(order.address ?? ""),
        notes: String(order.notes ?? ""),
        status: String(order.status ?? "nuevo"),
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.warn(`Failed to insert order ${oldOrderId}: ${error?.message}`);
      continue;
    }

    const items = itemsByOrderId.get(oldOrderId) ?? [];
    for (const item of items) {
      const oldProductId = String(item.product_id ?? "");
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: inserted.id,
        product_id: productIdMap.get(oldProductId) ?? null,
        variant_id: null,
        product_name_snapshot: String(item.product_name_snapshot ?? "Producto"),
        variant_label_snapshot: item.variant_label_snapshot
          ? String(item.variant_label_snapshot)
          : null,
        unit_price: Number(item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 1),
        subtotal: Number(item.subtotal ?? 0),
      });
      if (itemError) {
        console.warn(`Failed to insert order_item for order ${oldOrderId}: ${itemError.message}`);
      }
    }
  }
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN (no writes) ===" : "=== LIVE MIGRATION ===");

  const categoryBySlug = await migrateCategoriesLookup();
  console.log(`Loaded ${categoryBySlug.size} categories from Supabase.`);

  const productIdMap = await migrateProducts(categoryBySlug);
  console.log(`Migrated ${productIdMap.size} products.`);

  if (PRODUCTS_ONLY) {
    console.log("--products-only set: skipping users and orders.");
    console.log("Done.");
    return;
  }

  const userIdMap = await migrateUsers();
  console.log(`Migrated ${userIdMap.size} users.`);

  await migrateOrders(productIdMap, userIdMap);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
