"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { NewApplication } from "../lib/types";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (application: NewApplication) => void;
  onSubmit?: (application: NewApplication) => void;
}

export function AddApplicationModal({ isOpen, onClose, onAdd, onSubmit }: AddApplicationModalProps) {
  const [formData, setFormData] = useState<NewApplication>({
    company: "",
    position: "",
    status: "submitted",
    applicationDate: new Date().toISOString().split('T')[0],
    jobUrl: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.company && formData.position) {
      (onAdd || onSubmit)?.(formData);
      setFormData({
        company: "",
        position: "",
        status: "submitted",
        applicationDate: new Date().toISOString().split('T')[0],
        jobUrl: "",
        notes: "",
      });
      onClose();
    }
  };

  const handleChange = (field: keyof NewApplication, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Job Application</DialogTitle>
          <DialogDescription>
            Track a new job application by filling out the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="e.g. Google"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationDate">Application Date</Label>
            <Input
              id="applicationDate"
              type="date"
              value={formData.applicationDate}
              onChange={(e) => handleChange("applicationDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input
              id="jobUrl"
              type="url"
              value={formData.jobUrl}
              onChange={(e) => handleChange("jobUrl", e.target.value)}
              placeholder="https://company.com/jobs/123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any notes about this application..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}