import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CloseConfirmDialog } from "@/features/window/CloseConfirmDialog";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <CloseConfirmDialog />
    </div>
  );
}