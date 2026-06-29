import * as React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ──────────────────────────────────────────────────────────────
   Color / avatar helpers  (per design tokens)
   ────────────────────────────────────────────────────────────── */
export function avatarHue(name: string) {
  const sum = (name || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (sum * 37) % 360;
}
export function avatarStyle(name: string): React.CSSProperties {
  const h = avatarHue(name);
  return { background: `oklch(0.33 0.07 ${h})`, color: `oklch(0.85 0.13 ${h})` };
}
export function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 44, radius = 14, className }: {
  name: string; size?: number; radius?: number; className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center font-bold flex-shrink-0", className)}
      style={{ ...avatarStyle(name), width: size, height: size, borderRadius: radius, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Pills / badges
   ────────────────────────────────────────────────────────────── */
type Tone = "accent" | "neutral" | "emerald" | "sky" | "amber" | "rose";
const pillTone: Record<Tone, React.CSSProperties> = {
  accent:  { background: "var(--m-accent-soft)", color: "var(--m-accent)" },
  neutral: { background: "var(--m-inset)", color: "var(--m-muted)" },
  emerald: { background: "var(--m-aco-bg)", color: "var(--m-aco-fg)" },
  sky:     { background: "var(--m-sky-bg)", color: "var(--m-sky-fg)" },
  amber:   { background: "var(--m-amber-bg)", color: "var(--m-amber-fg)" },
  rose:    { background: "var(--m-rose-bg)", color: "var(--m-rose-fg)" },
};
export function Pill({ tone = "neutral", children, className, style }: {
  tone?: Tone; children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold leading-none", className)}
      style={{ ...pillTone[tone], ...style }}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Screen header  (Playfair title + subtitle + optional action)
   ────────────────────────────────────────────────────────────── */
export function ScreenHeader({ title, subtitle, action }: {
  title: string; subtitle?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="m-serif font-extrabold text-[28px] leading-none tracking-[-0.5px] text-[var(--m-text)] truncate">
          {title}
        </h1>
        {subtitle != null && (
          <p className="text-[13px] font-medium text-[var(--m-muted)] mt-1.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}

/* Accent square action button (e.g. the + button) */
export function IconButton({ onClick, children, soft, "aria-label": ariaLabel }: {
  onClick?: () => void; children: React.ReactNode; soft?: boolean; "aria-label"?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center active:scale-[0.96] transition-transform"
      style={soft
        ? { background: "var(--m-accent-soft)", color: "var(--m-accent)" }
        : { background: "var(--m-accent)", color: "#fff" }}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Surfaces
   ────────────────────────────────────────────────────────────── */
export function Card({ children, className, onClick, selected, style }: {
  children: React.ReactNode; className?: string; onClick?: () => void; selected?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[18px] border p-[15px] transition-colors",
        onClick && "active:brightness-95 cursor-pointer",
        className,
      )}
      style={{
        background: "var(--m-card)",
        borderColor: selected ? "var(--m-accent-border)" : "var(--m-card-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "var(--m-inset)", color: "var(--m-faint)" }}>
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-[var(--m-text)]">{title}</p>
      {hint && <p className="text-[13px] text-[var(--m-muted)] mt-1">{hint}</p>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-full border-2 animate-spin", className)}
      style={{ borderColor: "var(--m-track)", borderTopColor: "var(--m-accent)" }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   Form controls
   ────────────────────────────────────────────────────────────── */
export const inputStyle: React.CSSProperties = {
  background: "var(--m-input)", borderColor: "var(--m-input-border)", color: "var(--m-text)",
};
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...props.style }}
      className={cn(
        "w-full h-[46px] px-3.5 rounded-[13px] border text-[14.5px] outline-none placeholder:text-[var(--m-faint)]",
        "focus:border-[var(--m-accent-border)]",
        props.className,
      )}
    />
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-[var(--m-muted)] mb-1.5">{children}</label>;
}

/* Single-select chip group */
export function ChipGroup<T extends string>({ options, value, onChange, allowEmpty }: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T | "") => void;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(allowEmpty && active ? "" : o.value)}
            className="px-3.5 py-2 rounded-[11px] text-[13px] font-semibold border transition-colors active:scale-[0.98]"
            style={active
              ? { background: "var(--m-accent-soft)", color: "var(--m-accent)", borderColor: "var(--m-accent-border)" }
              : { background: "var(--m-inset)", color: "var(--m-muted)", borderColor: "transparent" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Primary full-width button */
export function PrimaryButton({ children, onClick, disabled, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[54px] rounded-[15px] text-[15px] font-bold text-white transition-all active:scale-[0.99] disabled:opacity-50"
      style={{ background: "var(--m-accent)" }}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Bottom sheet
   ────────────────────────────────────────────────────────────── */
export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="m-scrim absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        className="m-sheet-panel relative max-h-[88%] flex flex-col rounded-t-[26px] border-t"
        style={{ background: "var(--m-sheet)", borderColor: "var(--m-card-border)" }}
      >
        <div className="flex-shrink-0 pt-2.5 pb-1 flex justify-center">
          <span className="w-9 h-1 rounded-full" style={{ background: "var(--m-track)" }} />
        </div>
        {title != null && (
          <div className="flex items-center justify-between px-5 pt-1 pb-3">
            <div className="min-w-0">{title}</div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--m-inset)", color: "var(--m-muted)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="m-no-scrollbar overflow-y-auto px-5 pb-3 flex-1">{children}</div>
        {footer && (
          <div className="flex-shrink-0 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] border-t"
            style={{ borderColor: "var(--m-card-border)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Toast
   ────────────────────────────────────────────────────────────── */
type ToastState = { id: number; message: string } | null;
const ToastCtx = createContext<(message: string) => void>(() => {});
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const show = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 1900);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className="m-toast fixed left-1/2 z-[60] px-4 py-2.5 rounded-full text-[13px] font-semibold shadow-xl pointer-events-none"
          style={{
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px) + 14px)",
            background: "var(--m-card)",
            color: "var(--m-text)",
            border: "1px solid var(--m-card-border)",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
