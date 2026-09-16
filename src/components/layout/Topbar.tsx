import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Check } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import type { Locale } from "@/i18n";
import { SearchDialog } from "@/features/search/SearchDialog";

const LANGUAGES: { id: Locale; label: string }[] = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
];

export function Topbar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);

  const titleKey =
    {
      "/": "nav.dashboard",
      "/onboarding": "nav.onboarding",
      "/portfolio": "nav.portfolio",
      "/harbor": "nav.harbor",
      "/ai": "nav.ai",
      "/settings": "nav.settings",
    }[location.pathname] ?? "nav.dashboard";

  // Ctrl+K / Cmd+K 打开搜索
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)] px-6">
        <h1 className="text-sm font-medium text-[var(--color-strong)]">
          {t(titleKey)}
        </h1>
        <div className="flex items-center gap-2 text-[var(--color-muted)]">
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-md p-1.5 hover:bg-[var(--color-panel-2)]"
            title={t("topbar.search")}
          >
            <Search className="h-4 w-4" />
          </button>
          <LanguageMenu current={locale} onChange={setLocale} />
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* ---------------- 语言下拉 ---------------- */

function LanguageMenu({
  current,
  onChange,
}: {
  current: Locale;
  onChange: (l: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const currentLabel =
    LANGUAGES.find((l) => l.id === current)?.label ?? "中文";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 px-2 py-1 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-strong)]"
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[7rem] rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg">
          {LANGUAGES.map((lang) => {
            const active = lang.id === current;
            return (
              <button
                key={lang.id}
                onClick={() => {
                  onChange(lang.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-xs transition-colors " +
                  (active
                    ? "text-[var(--color-strong)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]")
                }
              >
                <span>{lang.label}</span>
                {active && (
                  <Check className="h-3 w-3 shrink-0 text-[var(--color-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}