import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-100 text-indigo-700",
        secondary:
          "border-transparent bg-gray-100 text-gray-700",
        destructive:
          "border-transparent bg-red-100 text-red-700",
        outline: "border-gray-200 text-gray-700",
        blue: "border-transparent bg-blue-50 text-blue-700",
        pink: "border-transparent bg-pink-50 text-pink-700",
        teal: "border-transparent bg-teal-50 text-teal-700",
        amber: "border-transparent bg-amber-50 text-amber-700",
        orange: "border-transparent bg-orange-50 text-orange-700",
        slate: "border-transparent bg-slate-100 text-slate-700",
        purple: "border-transparent bg-purple-50 text-purple-700",
        green: "border-transparent bg-green-50 text-green-700",
        emerald: "border-transparent bg-emerald-50 text-emerald-700",
        indigo: "border-transparent bg-indigo-50 text-indigo-700",
        rose: "border-transparent bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
