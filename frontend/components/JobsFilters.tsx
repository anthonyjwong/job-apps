"use client";

import { Brain, Briefcase, MapPin, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type JobsFiltersProps = {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  location: string;
  onLocation: (v: string) => void;
  type: string;
  onType: (v: string) => void;
};

export function JobsFilters({ search, onSearch, category, onCategory, location, onLocation, type, onType }: JobsFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search jobs, companies, or skills..." value={search} onChange={(e) => onSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div>
          <Select value={category} onValueChange={onCategory}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <SelectValue placeholder="AI Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="safety">Safety Jobs</SelectItem>
              <SelectItem value="target">Target Jobs</SelectItem>
              <SelectItem value="reach">Reach Jobs</SelectItem>
              <SelectItem value="dream">Dream Jobs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={location} onValueChange={onLocation}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="San Francisco">San Francisco</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Austin">Austin</SelectItem>
              <SelectItem value="Seattle">Seattle</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={type} onValueChange={onType}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <SelectValue placeholder="Job Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full-time">Full Time</SelectItem>
              <SelectItem value="part-time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
