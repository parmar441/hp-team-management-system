import * as React from "react";

type Width = "default" | "wide" | "narrow";

const widthMap: Record<Width, string> = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[1600px]",
};

/**
 * Standard page shell — consistent padding, max-width and vertical rhythm
 * across every screen size. Use as the outermost element of a page.
 */
export function PageContainer({
  children,
  width = "default",
  className = "",
}: {
  children: React.ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <div className={`w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 ${widthMap[width]} ${className}`}>
      {children}
    </div>
  );
}

const toneMap: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600",
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  sky: "bg-sky-100 text-sky-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

/**
 * Standard page header — icon + title + subtitle on the left, actions on the
 * right. Title/actions sit on one row from `sm` up and stack cleanly on mobile.
 */
export function PageHeader({
  icon,
  tone = "indigo",
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  tone?: keyof typeof toneMap;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${toneMap[tone] ?? toneMap.indigo}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
