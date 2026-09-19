import { getEmbedder, cosine } from "@/lib/embedding";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const e = await getEmbedder();
  if (!e) throw new Error("embedding not configured");
  const ready = await e.isReady();
  if (!ready) throw new Error(`embedder not ready: ${e.name}`);
  return e.embed(texts);
}

export { cosine };