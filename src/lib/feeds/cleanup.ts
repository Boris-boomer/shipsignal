import { getDb } from "@/lib/db";

export async function clearAllFeeds(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM feeds");
}

const SIXTEEN_HOURS = 16 * 60 * 60 * 1000;

/**
 * 启动时清空（相当于"关软件清空"），并挂 16 小时定时器
 * 返回停止函数（用于卸载）
 */
export function startFeedsCleanup(): () => void {
  // 启动即清一次：清掉上个会话残留
  void clearAllFeeds();

  // 每 16 小时清一次：防止长时间挂着堆积
  const timer = setInterval(() => {
    void clearAllFeeds();
  }, SIXTEEN_HOURS);

  return () => clearInterval(timer);
}