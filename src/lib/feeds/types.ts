export interface RawFeedItem {
  id: string;
  title: string;
  url: string;
  summary?: string;
  score?: number;
}

export interface Fetcher {
  id: string;
  run: (keywords: string[]) => Promise<RawFeedItem[]>;
}