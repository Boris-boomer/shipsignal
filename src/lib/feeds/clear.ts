import { getDb } from "@/lib/db";

export async function clearFeeds(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM feeds");
}