import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { avatarUrl } from "@/services/community";
import { cn } from "@/lib/utils";

export function RiderAvatar({
  path,
  name,
  className,
}: {
  path?: string | null;
  name?: string | null;
  className?: string;
}) {
  const { data: url } = useQuery({
    queryKey: ["avatar", path],
    queryFn: () => avatarUrl(path),
    enabled: !!path,
    staleTime: 45 * 60 * 1000,
  });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 text-muted-foreground",
        className ?? "h-10 w-10",
      )}
    >
      {url ? (
        <img src={url} alt={name ?? "Piloto"} className="h-full w-full object-cover" />
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}
