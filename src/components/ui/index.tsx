import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* ---------------- Button ---------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-40",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-panel-2)] text-[var(--color-strong)] hover:border-[var(--color-accent)]",
  ghost:
    "text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]",
  danger:
    "border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-md",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Card ---------------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3",
        className
      )}
    >
      <div>
        <div className="text-sm font-medium text-[var(--color-strong)]">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

/* ---------------- Input / Textarea / Select ---------------- */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--color-muted)]">
        {label}
      </label>
      {children}
      {hint && (
        <div className="mt-1 text-[0.6rem] text-[var(--color-muted)]">{hint}</div>
      )}
    </div>
  );
}

/* ---------------- Badge ---------------- */

type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral:
    "border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-panel-2)]",
  accent:
    "border-[var(--color-accent)]/40 text-[var(--color-accent)] bg-[var(--color-accent)]/10",
  success:
    "border-[var(--color-accent-2)]/40 text-[var(--color-accent-2)] bg-[var(--color-accent-2)]/10",
  warn:
    "border-[var(--color-warn)]/40 text-[var(--color-warn)] bg-[var(--color-warn)]/10",
  danger:
    "border-[var(--color-danger)]/40 text-[var(--color-danger)] bg-[var(--color-danger)]/10",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Tabs ---------------- */

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "border-[var(--color-accent)] text-[var(--color-strong)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-strong)]"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded px-1 text-[0.6rem]",
                  active
                    ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                    : "bg-[var(--color-panel-2)] text-[var(--color-muted)]"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- EmptyState ---------------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] py-14">
      <div className="text-sm text-[var(--color-strong)]">{title}</div>
      {description && (
        <div className="mt-1 max-w-sm text-center text-xs text-[var(--color-muted)]">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- ConfirmDialog ---------------- */

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">{title}</div>
        {description && (
          <div className="text-xs leading-relaxed text-[var(--color-muted)]">
            {description}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}