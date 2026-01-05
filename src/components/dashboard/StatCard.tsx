import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, change, changeType = "neutral", icon: Icon, iconColor = "bg-gray-100 text-gray-700" }, ref) => {
    return (
      <div ref={ref} className="stat-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-heading font-medium text-foreground mt-2">
              {value}
            </p>
            {change && (
              <p className={cn(
                "text-sm mt-2",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-gray-500"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-sm", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export default StatCard;
