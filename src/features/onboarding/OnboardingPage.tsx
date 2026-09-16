import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lightbulb, Package, Layers } from "lucide-react";
import type { Entry, Mode } from "@/lib/types";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

const ENTRIES: {
  entry: Entry;
  mode: Mode;
  titleKey: string;
  descKey: string;
  icon: typeof Lightbulb;
}[] = [
  {
    entry: "A",
    mode: "validate_first",
    titleKey: "onboarding.entry.A.title",
    descKey: "onboarding.entry.A.desc",
    icon: Lightbulb,
  },
  {
    entry: "B",
    mode: "build_first",
    titleKey: "onboarding.entry.B.title",
    descKey: "onboarding.entry.B.desc",
    icon: Package,
  },
  {
    entry: "C",
    mode: "portfolio",
    titleKey: "onboarding.entry.C.title",
    descKey: "onboarding.entry.C.desc",
    icon: Layers,
  },
];

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useProjectStore((s) => s.create);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const current = ENTRIES.find((e) => e.entry === selected) ?? null;

  async function handleCreate() {
    if (!current || !name.trim()) return;
    setSaving(true);
    try {
      const p = await create({
        mode: current.mode,
        entry: current.entry,
        name: name.trim(),
        description: desc.trim(),
        status: "planning",
      });
      navigate(`/project/${p.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-strong)]">
          {t("onboarding.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("onboarding.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ENTRIES.map((e) => {
          const Icon = e.icon;
          const isSel = selected === e.entry;
          return (
            <button
              key={e.entry}
              onClick={() => setSelected(e.entry)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                isSel
                  ? "border-[var(--color-accent)] bg-[var(--color-panel-2)]"
                  : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  isSel
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-panel-2)] text-[var(--color-muted)]"
                )}
              >
                <Icon size="1.125rem" />
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--color-strong)]">
                  {t(e.titleKey)}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                  {t(e.descKey)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
          <div className="text-sm font-medium text-[var(--color-strong)]">
            {t("onboarding.form.title")}
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">
              {t("onboarding.form.name")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding.form.namePlaceholder")}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">
              {t("onboarding.form.description")}
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={!name.trim() || saving}
              onClick={handleCreate}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving
                ? t("onboarding.form.creating")
                : t("onboarding.form.create")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}