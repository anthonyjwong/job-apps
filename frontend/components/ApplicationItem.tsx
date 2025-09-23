"use client";

import { ApplicationStatus, JobClassification } from "../lib/types";
import { JobClassificationBadge } from "./JobClassificationBadge";
import { Badge } from "./ui/badge";

interface ApplicationItemProps {
  company: string;
  position: string;
  status: ApplicationStatus;
  classification?: JobClassification;
  onClick?: () => void;
}

export function ApplicationItem({ company, position, status, classification, onClick }: ApplicationItemProps) {
  const statusConfig: Record<ApplicationStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    started: { label: "Started", variant: "secondary" },
    submitted: { label: "Submitted", variant: "secondary" },
    assessment: { label: "Assessment", variant: "default" },
    interview: { label: "Interview", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    offer: { label: "Offer", variant: "default" },
    accepted: { label: "Accepted", variant: "default" },
    withdrawn: { label: "Withdrawn", variant: "outline" },
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
          {classification && <JobClassificationBadge classification={classification} size="sm" />}
        </div>
        <div className="text-sm text-muted-foreground">{position}</div>
      </div>
      <Badge variant={config.variant} className="ml-4">
        {config.label}
      </Badge>
    </div>
  );
}