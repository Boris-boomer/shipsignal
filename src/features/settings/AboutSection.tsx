import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Github, Mail, Heart, Check } from "lucide-react";
import { hasSupported, markSupported } from "@/lib/db";

const GITHUB_REPO_URL = "https://github.com/Boris-boomer/shipsignal";
const FEEDBACK_EMAIL = "3090287415@qq.com";

export function AboutSection() {
  const { t } = useTranslation();
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasSupported().then((done) => {
      if (cancelled) return;
      setSupported(done);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSupport() {
    if (supported) return;
    await markSupported();
    setSupported(true);
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div>
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("settings.about.title")}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          {t("settings.about.version")}
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-[var(--color-muted)]">
          {t("settings.about.feedback")}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-strong)]"
          >
            <Github className="h-3 w-3" />
            GitHub Star / Issues
          </a>
          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=ShipSignal%20feedback`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-strong)]"
          >
            <Mail className="h-3 w-3" />
            {FEEDBACK_EMAIL}
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[var(--color-strong)]">
              {supported
                ? t("settings.about.thanks")
                : t("settings.about.supportQuestion")}
            </div>
            <div className="mt-0.5 text-[0.6rem] text-[var(--color-muted)]">
              {supported
                ? t("settings.about.thanksHint")
                : t("settings.about.supportHint")}
            </div>
          </div>
          <button
            onClick={handleSupport}
            disabled={!ready || supported}
            className={
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed " +
              (supported
                ? "border border-[var(--color-border)] bg-[var(--color-panel-2)] text-white"
                : "bg-[var(--color-accent)] text-[var(--color-strong)] hover:opacity-90")
            }
          >
            {supported ? (
              <>
                <Check className="h-3 w-3" />
                {t("settings.about.supported")}
              </>
            ) : (
              <>
                <Heart className="h-3 w-3" />
                {t("settings.about.supportAction")}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/30 p-4">
        <div className="mb-3 text-xs text-[var(--color-muted)]">
          {t("settings.about.donateHint")}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
              <img
                src="/donate/wechat.png"
                alt={t("settings.about.wechat")}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-[0.6rem] text-[var(--color-muted)]">
              {t("settings.about.wechat")}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
              <img
                src="/donate/alipay.png"
                alt={t("settings.about.alipay")}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-[0.6rem] text-[var(--color-muted)]">
              {t("settings.about.alipay")}
            </div>
          </div>
        </div>
        <div className="mt-3 text-center text-[0.6rem] text-[var(--color-muted)]">
          {t("settings.about.scanHint")}
        </div>
      </div>
    </section>
  );
}