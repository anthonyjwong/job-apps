import { Shield, Star, Target, TrendingUp } from "lucide-react";
import { JobCategory } from "../lib/types";
import { Badge } from "./ui/badge";

interface JobCategoryBadgeProps {
  category: JobCategory;
  size?: "sm" | "md" | "lg";
}

const categoryConfig = {
  safety: {
    label: "Safety",
    icon: Shield,
    description: "High interview likelihood - strong profile match",
    className: "bg-safety text-safety-foreground border-safety/20",
  },
  target: {
    label: "Target", 
    icon: Target,
    description: "Good interview likelihood - solid fit for role",
    className: "bg-target text-target-foreground border-target/20",
  },
  reach: {
    label: "Reach",
    icon: TrendingUp, 
    description: "Medium interview likelihood - growth opportunity",
    className: "bg-reach text-reach-foreground border-reach/20",
  },
  dream: {
    label: "Dream",
    icon: Star,
    description: "Career aspiration - role to build towards",
    className: "bg-dream text-dream-foreground border-dream/20",
  },
};

export function JobCategoryBadge({ category, size = "md" }: JobCategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  const sizeClass = {
    sm: "h-5 px-2 text-xs",
    md: "h-6 px-2.5 text-sm", 
    lg: "h-7 px-3 text-sm",
  }[size];

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4", 
  }[size];

  return (
    <Badge className={`${config.className} ${sizeClass} gap-1 font-medium`}>
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
}

export function getCategoryDescription(category: JobCategory): string {
  return categoryConfig[category].description;
}

export function getCategoryColor(category: JobCategory): string {
  return {
    safety: "safety",
    target: "target", 
    reach: "reach",
    dream: "dream",
  }[category];
}