"use client";

import { Calendar, Check, ChevronDown, Download, Edit, ExternalLink, Eye, Filter, MapPin, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiService } from "../lib/api";
import type { Application, ApplicationStatus, NewApplication } from "../lib/types";
import { AddApplicationModal } from "./AddApplicationModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function ApplicationsView({ initialApplications }: { initialApplications: Application[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we ever need client refetching, enable here. Default to server-provided data.
  }, []);

  const handleAddApplication = async (newApp: NewApplication) => {
    const response = await apiService.createApplication({
      ...newApp,
      priority: "medium",
    });
    const data = response.data;
    if (data && data.application) {
      setApplications((prev) => [data.application, ...prev]);
      (window as any).showToast?.({
        type: "success",
        title: "Application Added!",
        message: `Successfully added application to ${newApp.company}`,
      });
    } else {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to add application. Please try again.",
      });
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: ApplicationStatus) => {
    const response = await apiService.updateApplication(applicationId, { status: newStatus });
    if (response.data) {
      setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app)));
      const application = applications.find((app) => app.id === applicationId);
      if (application) {
        (window as any).showToast?.({
          type: "success",
          title: "Status Updated!",
          message: `${application.company} application status changed to ${newStatus}`,
        });
      }
    } else {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to update status. Please try again.",
      });
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "submitted":
        return "secondary";
      case "interviewed":
        return "default";
      case "offered":
        return "default";
      case "rejected":
        return "destructive";
      case "withdrawn":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredApplications = useMemo(() => {
    const filtered = applications
      .filter((app) => {
        const matchesSearch =
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.position.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date-desc":
            return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
          case "date-asc":
            return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
          case "company":
            return a.company.localeCompare(b.company);
          case "status":
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    return filtered;
  }, [applications, searchTerm, statusFilter, sortBy]);

  const handleSelectApplication = (id: number, checked: boolean) => {
    setSelectedApplications((prev) => (checked ? [...prev, id] : prev.filter((appId) => appId !== id)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedApplications(filteredApplications.map((app) => app.id));
    else setSelectedApplications([]);
  };

  const statusCounts = {
    all: applications.length,
    submitted: applications.filter((app) => app.status === "submitted").length,
    interviewed: applications.filter((app) => app.status === "interviewed").length,
    offered: applications.filter((app) => app.status === "offered").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    withdrawn: applications.filter((app) => app.status === "withdrawn").length,
  };

  const statusOptions: { value: ApplicationStatus; label: string; color: string }[] = [
    { value: "submitted", label: "Submitted", color: "secondary" },
    { value: "interviewed", label: "Interviewed", color: "default" },
    { value: "offered", label: "Offered", color: "default" },
    { value: "rejected", label: "Rejected", color: "destructive" },
    { value: "withdrawn", label: "Withdrawn", color: "outline" },
  ];

  const StatusBadge = ({ application }: { application: Application }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Badge variant={getStatusColor(application.status)} className="hover:opacity-80 transition-opacity flex items-center gap-1">
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              <ChevronDown className="w-3 h-3" />
            </Badge>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => {
                  handleStatusChange(application.id, option.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {application.status === option.value && <Check className="w-3 h-3" />}
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>All Applications</h1>
          <p className="text-muted-foreground">Manage and track your job applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dataToExport = JSON.stringify(applications, null, 2);
              const blob = new Blob([dataToExport], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `applications-${new Date().toISOString().split("T")[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              (window as any).showToast?.({
                type: "success",
                title: "Export Complete!",
                message: `Exported ${applications.length} applications successfully`,
              });
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        {(
          [
            { key: "all", label: "Total", count: statusCounts.all },
            { key: "submitted", label: "Submitted", count: statusCounts.submitted },
            { key: "interviewed", label: "Interviewed", count: statusCounts.interviewed },
            { key: "offered", label: "Offers", count: statusCounts.offered },
            { key: "rejected", label: "Rejected", count: statusCounts.rejected },
            { key: "withdrawn", label: "Withdrawn", count: statusCounts.withdrawn },
          ] as const
        ).map((s) => (
          <Card key={s.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter(s.key)}>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-medium">{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search companies or positions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedApplications.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm">
                {selectedApplications.length} application{selectedApplications.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => console.log("Bulk updating status for:", selectedApplications)}>
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete ${selectedApplications.length} selected applications?`)) {
                      setApplications((prev) => prev.filter((app) => !selectedApplications.includes(app.id)));
                      const deletedCount = selectedApplications.length;
                      setSelectedApplications([]);
                      (window as any).showToast?.({
                        type: "info",
                        title: "Applications Deleted",
                        message: `Successfully deleted ${deletedCount} applications`,
                      });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Company & Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedApplications.includes(application.id)}
                      onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{application.company}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-64">{application.position}</div>
                      {application.contacts && application.contacts.length > 0 && (
                        <div className="text-xs text-muted-foreground">Contact: {application.contacts[0].name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge application={application} />
                  </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(application.applicationDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {application.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{application.salary && <div className="text-sm">{application.salary}</div>}</TableCell>
                    <TableCell>
                      {application.priority && (
                        <div className={`text-sm capitalize ${getPriorityColor(application.priority)}`}>{application.priority}</div>
                      )}
                    </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log("Viewing details for:", application.company)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Editing application:", application.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Application
                        </DropdownMenuItem>
                        {application.jobUrl && (
                          <DropdownMenuItem onClick={() => window.open(application.jobUrl!, "_blank")!}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Job Posting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete application to ${application.company}?`)) {
                              setApplications((prev) => prev.filter((app) => app.id !== application.id));
                              console.log("Deleted application:", application.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Application
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No applications found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddApplicationModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddApplication} />
    </div>
  );
}
