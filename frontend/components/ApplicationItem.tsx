"use client";

import { Badge } from "./ui/badge";
import { JobCategoryBadge } from "./JobCategoryBadge";
import { ApplicationStatus, JobCategory } from "../lib/types";

interface ApplicationItemProps {
  company: string;
  position: string;
  status: ApplicationStatus;
  category?: JobCategory;
  onClick?: () => void;
}

export function ApplicationItem({ company, position, status, category, onClick }: ApplicationItemProps) {
  const statusConfig = {
    submitted: { label: "Submitted", variant: "secondary" as const },
    interviewed: { label: "Interviewed", variant: "default" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
    offered: { label: "Offered", variant: "default" as const },
    withdrawn: { label: "Withdrawn", variant: "outline" as const },
  };

  const config = statusConfig[status];

  return (
    <div 
      className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer"
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          // Default action - could open application details
          console.log(`Opening application details for ${company} - ${position}`);
        }
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-sm">{company}</div>
          {category && <JobCategoryBadge category={category} size="sm" />}
        </div>
        <div className="text-sm text-muted-foreground">{position}</div>
      </div>
      <Badge variant={config.variant} className="ml-4">
        {config.label}
      </Badge>
    </div>
  );
}