"use client";

import { Brain, Building, Clock, DollarSign, Lightbulb, MapPin } from "lucide-react";
import type { JobClassification } from "../lib/types";
import { JobClassificationBadge } from "./JobClassificationBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: "fulltime" | "parttime" | "contract" | "internship" | "other" | null;
  postedDate: string;
  description: string;
  skills: string[];
  classification: JobClassification;
  score: number;
  action?: string;
  onApply: (jobId: string) => void;
  onSave: (jobId: string) => void;
  isSaved?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  location,
  salary,
  type,
  postedDate,
  description,
  skills,
  classification,
  score,
  action,
  onApply,
  onSave,
  isSaved = false,
}: JobCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "fulltime": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "parttime": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "contract": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "internship": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "other": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };
  skills = skills || ["skill1", "skill2", "skill3", "skill4", "skill5"];

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium">{title}</h3>
            <JobClassificationBadge classification={classification} size="sm" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {company}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </div>
            {salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {salary}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {postedDate}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {type ? (
              <Badge className={getTypeColor(type)} variant="secondary">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <Brain className="w-3 h-3" />
            <span>Interview Score</span>
          </div>
          <div className="text-lg font-semibold text-primary">{score}%</div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 overflow-hidden">
        {description && description.length > 150 ? `${description.substring(0, 150)}...` : description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 4).map((skill) => (
          <Badge key={skill} variant="outline" className="text-xs">
            {skill}
          </Badge>
        ))}
        {skills.length > 4 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 4} more
          </Badge>
        )}
      </div>

      {action && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground">{action}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={() => onApply(id)} className="flex-1">
          Apply Now
        </Button>
        <Button variant="outline" onClick={() => onSave(id)}>
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}