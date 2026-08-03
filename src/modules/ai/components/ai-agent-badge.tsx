import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AiAgentBadgeProps {
  name: string;
  isBuiltin?: boolean;
  className?: string;
}

export function AiAgentBadge({ name, isBuiltin = false, className }: AiAgentBadgeProps) {
  return (
    <Badge variant={isBuiltin ? "default" : "outline"} className={cn("font-normal", className)}>
      {name}
      {isBuiltin ? " · Built-in" : null}
    </Badge>
  );
}
