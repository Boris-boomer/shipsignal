import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { startFeedsCleanup } from "@/lib/feeds/cleanup";

export function App() {
  useEffect(() => {
    const stop = startFeedsCleanup();
    return stop;
  }, []);

  return <RouterProvider router={router} />;
}