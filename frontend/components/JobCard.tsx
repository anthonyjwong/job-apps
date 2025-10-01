"use client";

import { Building, Clock, DollarSign, Heart, Lightbulb, MapPin, RefreshCw, X } from "lucide-react";
import type { JobClassification } from "../lib/types";
import { JobClassificationBadge } from "./JobClassificationBadge";
import MarkdownRenderer from "./MarkdownRenderer";
import { useTheme } from "./ThemeProvider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const classificationOrder: JobClassification[] = ["safety", "target", "reach", "dream"];



interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type?: "fulltime" | "parttime" | "contract" | "internship" | "other";
  postedDate: string;
  description?: string;
  classification: JobClassification;
  action?: string;
  skills: string[];
  onSave: (jobId: string) => void;
  onClassificationChange: (jobId: string, newClassification: JobClassification) => void;
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
  classification,
  action,
  skills,
  onSave,
  onClassificationChange
}: JobCardProps) {
  let theme: 'light' | 'dark' = 'light';
  try {
    const ctx = useTheme();
    theme = ctx.theme;
  } catch (_e) {
    // if provider missing, fall back silently
  }

  const handleClassificationClick = () => {
    const currentIndex = classificationOrder.indexOf(classification);
    const nextIndex = (currentIndex + 1) % classificationOrder.length;
    const newClassification = classificationOrder[nextIndex];
    onClassificationChange(id, newClassification);
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "fulltime": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "parttime": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "contract": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "internship": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "other": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  skills = ["skill1", "skill2", "skill3"]; // Default skills if undefined

  return (
    <div className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      {/* primary info: role, company, classification */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-xl mb-2 line-clamp-2 text-foreground">
            {title}
          </h2>

          <div className="flex items-center gap-2 mb-3">
            <Building className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg text-primary">{company}</span>
          </div>
        </div>

        <div className="ml-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handleClassificationClick}
                  className="cursor-pointer hover:scale-110 transition-transform group/badge relative"
                >
                  <JobClassificationBadge classification={classification} size="lg" />
                  <RefreshCw className="w-3 h-3 absolute -top-1 -right-1 opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to cycle classification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* secondary job details */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        {postedDate &&
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{postedDate}</span>
          </div>
        }
        {type &&
          <Badge className={getTypeColor(type)} variant="secondary">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        }
        {salary && (
          <Badge variant="outline" className="text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            {salary}
          </Badge>
        )}
      </div>

      {/* job description */}
      {description && (
        <div className="mb-4 text-sm text-muted-foreground">
          <MarkdownRenderer
            markdown={description}
            darkMode={theme === 'dark'}
            collapsible
            previewCharLimit={260}
            theme={{
              link: 'var(--primary)',
              border: 'var(--border)',
              muted: 'var(--muted-foreground)',
              text: 'var(--foreground)',
              appBg: 'var(--card)'
            }}
          />
        </div>
      )}

      {/* recommendation */}
      {action && (
        <div className="mb-5 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground">{action}</p>
            </div>
          </div>
        </div>
      )}

      {/* footer: skills and actions */}
      <div className="flex items-end justify-between">
        {/* Skills */}
        <div className="flex flex-wrap gap-2 flex-1 mr-4">
          {skills.slice(0, 5).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="text-xs px-2 py-1 hover:bg-accent transition-colors"
            >
              {skill}
            </Badge>
          ))}
          {skills.length > 5 && (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-muted">
              +{skills.length - 5} more
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-4">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save to your collection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dismiss job</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}