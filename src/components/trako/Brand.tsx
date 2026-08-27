import mark from "@/assets/trako-mark.png";
import { cn } from "@/lib/utils";

export function TrakoMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt="TRAKO"
      width={1024}
      height={1024}
      className={cn("object-contain", className)}
    />
  );
}

export function TrakoLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TrakoMark className={dims} />
      <span className={cn("font-display font-bold tracking-tight", text)}>TRAKO</span>
    </div>
  );
}
