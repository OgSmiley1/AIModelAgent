import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  title?: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HelpTooltip({ 
  content, 
  title, 
  side = "top", 
  className,
  size = "sm" 
}: HelpTooltipProps) {
  const iconSize = size === "sm" ? 14 : size === "md" ? 16 : 18;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle 
            size={iconSize} 
            className={cn(
              "text-muted-foreground hover:text-foreground cursor-help transition-colors",
              className
            )}
            data-testid="help-tooltip-trigger"
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          {title && <p className="font-medium mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}