import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-gray-100 rounded-lg animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };
