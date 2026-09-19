export interface Embedder {
  name: string;
  isReady(): Promise<boolean>;
  embed(texts: string[]): Promise<number[][]>;
}