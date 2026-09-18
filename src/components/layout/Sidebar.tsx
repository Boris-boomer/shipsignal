import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sun,
  LayoutDashboard,
  FolderKanban,
  Bot,
  Settings as SettingsIcon,
  Sparkles,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", labelKey: "nav.today", icon: Sun, end: true },
  {
    to: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    end: false,
  },
  {
    to: "/onboarding",
    labelKey: "nav.onboarding",
    icon: Sparkles,
    end: false,
  },
  {
    to: "/portfolio",
    labelKey: "nav.portfolio",
    icon: FolderKanban,
    end: false,
  },
  { to: "/harbor", labelKey: "nav.harbor", icon: Anchor, end: false },
  { to: "/ai", labelKey: "nav.ai", icon: Bot, end: false },
  {
    to: "/settings",
    labelKey: "nav.settings",
    icon: SettingsIcon,
    end: false,
  },
];

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-sm font-bold text-white">
          S
        </div>
        <div className="text-sm font-semibold tracking-wide">ShipSignal</div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-panel-2)] text-[var(--color-strong)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3 text-xs text-[var(--color-muted)]">
        {t("nav.footer")}
      </div>
    </aside>
  );
}