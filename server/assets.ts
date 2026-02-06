import { eq } from "drizzle-orm";
import { assets, assetCategories, type InsertAsset } from "../drizzle/schema";
import { getDb } from "./db";

export async function createAssetCategory(name: string, slug: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(assetCategories).values({
    name,
    slug,
    description,
  });
}

export async function getAssetCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(assetCategories);
}

export async function uploadAsset(asset: InsertAsset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(assets).values(asset);
  return result;
}

export async function getAssetsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(assets).where(eq(assets.categoryId, categoryId));
}

export async function getAllAssets() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(assets);
}

export async function deleteAsset(assetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(assets).where(eq(assets.id, assetId));
}
