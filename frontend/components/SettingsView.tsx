"use client";

import { saveNotifications, savePreferences, savePrivacy, saveProfile } from "@/app/settings/actions";
import { Bell, Briefcase, Calendar, DollarSign, Download, Mail, MapPin, Phone, Save, Shield, Trash2, Upload, User } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

export type SettingsInitialData = {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    experience: string;
    salaryMin: string;
    salaryMax: string;
    bio: string;
  };
  notifications: {
    emailDigest: boolean;
    applicationUpdates: boolean;
    interviewReminders: boolean;
    newJobMatches: boolean;
    weeklyReport: boolean;
    pushNotifications: boolean;
    smsReminders: boolean;
  };
  preferences: {
    autoApplyEnabled: boolean;
    defaultApplicationStatus: string;
    reminderDays: string;
    dataRetention: string;
    exportFormat: string;
    timezone: string;
  };
  privacy: {
    profileVisible: boolean;
    analyticsEnabled: boolean;
    dataSharing: boolean;
    marketingEmails: boolean;
  };
};

export function SettingsView({ profile: initialProfile, notifications: initialNotifications, preferences: initialPreferences, privacy: initialPrivacy }: SettingsInitialData) {
  const [profile, setProfile] = useState(initialProfile);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [privacy, setPrivacy] = useState(initialPrivacy);

  const handleProfileChange = (field: string, value: string) => setProfile(prev => ({ ...prev, [field]: value }));
  const handleNotificationChange = (field: string, value: boolean) => setNotifications(prev => ({ ...prev, [field]: value }));
  const handlePreferenceChange = (field: string, value: string | boolean) => setPreferences(prev => ({ ...prev, [field]: value }));
  const handlePrivacyChange = (field: string, value: boolean) => setPrivacy(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <h1 className="sr-only">Settings</h1>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1>Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information and professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={profile.firstName} onChange={(e) => handleProfileChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={profile.lastName} onChange={(e) => handleProfileChange("lastName", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input id="email" type="email" value={profile.email} onChange={(e) => handleProfileChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input id="phone" value={profile.phone} onChange={(e) => handleProfileChange("phone", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input id="location" value={profile.location} onChange={(e) => handleProfileChange("location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Current Title
                </Label>
                <Input id="title" value={profile.title} onChange={(e) => handleProfileChange("title", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="experience" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Experience Level
                </Label>
                <Select value={profile.experience} onValueChange={(value) => handleProfileChange("experience", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1 years">0-1 years</SelectItem>
                    <SelectItem value="2-4 years">2-4 years</SelectItem>
                    <SelectItem value="5-7 years">5-7 years</SelectItem>
                    <SelectItem value="8-10 years">8-10 years</SelectItem>
                    <SelectItem value="10+ years">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMin" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Min Salary ($)
                </Label>
                <Input id="salaryMin" type="number" value={profile.salaryMin} onChange={(e) => handleProfileChange("salaryMin", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary ($)</Label>
                <Input id="salaryMax" type="number" value={profile.salaryMax} onChange={(e) => handleProfileChange("salaryMax", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea id="bio" value={profile.bio} onChange={(e) => handleProfileChange("bio", e.target.value)} placeholder="Tell employers about your experience and goals..." className="min-h-[100px]" />
            </div>

            <Button className="flex items-center gap-2" onClick={async () => {
              const resp = await saveProfile(profile);
              if (resp.success) {
                (window as any).showToast?.({ type: "success", title: "Profile Updated!", message: "Your profile changes have been saved" });
              } else {
                (window as any).showToast?.({ type: "error", title: "Save failed", message: resp.message ?? "Please try again" });
              }
            }}>
              <Save className="w-4 h-4" />
              Save Profile Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how and when you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Digest</Label>
                  <p className="text-sm text-muted-foreground">Daily summary of your job search activity</p>
                </div>
                <Switch checked={notifications.emailDigest} onCheckedChange={(checked) => handleNotificationChange("emailDigest", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Application Updates</Label>
                  <p className="text-sm text-muted-foreground">Status changes on your applications</p>
                </div>
                <Switch checked={notifications.applicationUpdates} onCheckedChange={(checked) => handleNotificationChange("applicationUpdates", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Interview Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders 24 hours before interviews</p>
                </div>
                <Switch checked={notifications.interviewReminders} onCheckedChange={(checked) => handleNotificationChange("interviewReminders", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>New Job Matches</Label>
                  <p className="text-sm text-muted-foreground">Jobs that match your preferences</p>
                </div>
                <Switch checked={notifications.newJobMatches} onCheckedChange={(checked) => handleNotificationChange("newJobMatches", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">Weekly analytics and insights</p>
                </div>
                <Switch checked={notifications.weeklyReport} onCheckedChange={(checked) => handleNotificationChange("weeklyReport", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser notifications for urgent updates</p>
                </div>
                <Switch checked={notifications.pushNotifications} onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>SMS Reminders</Label>
                  <p className="text-sm text-muted-foreground">Text message reminders for interviews</p>
                </div>
                <Switch checked={notifications.smsReminders} onCheckedChange={(checked) => handleNotificationChange("smsReminders", checked)} />
              </div>
            </div>
            <Button className="flex items-center gap-2" onClick={async () => {
              const resp = await saveNotifications(notifications);
              if (resp.success) {
                (window as any).showToast?.({ type: "success", title: "Notifications Updated", message: "Your notification preferences have been saved" });
              } else {
                (window as any).showToast?.({ type: "error", title: "Save failed", message: resp.message ?? "Please try again" });
              }
            }}>
              <Save className="w-4 h-4" />
              Save Notification Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Application Preferences</CardTitle>
            <CardDescription>Customize your job application workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultStatus">Default Application Status</Label>
                <Select value={preferences.defaultApplicationStatus} onValueChange={(value) => handlePreferenceChange("defaultApplicationStatus", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDays">Follow-up Reminder (Days)</Label>
                <Select value={preferences.reminderDays} onValueChange={(value) => handlePreferenceChange("reminderDays", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (Months)</Label>
                <Select value={preferences.dataRetention} onValueChange={(value) => handlePreferenceChange("dataRetention", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-Apply to Jobs</Label>
                <p className="text-sm text-muted-foreground">Automatically apply to jobs matching your criteria</p>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <Switch checked={preferences.autoApplyEnabled} onCheckedChange={(checked) => handlePreferenceChange("autoApplyEnabled", checked)} disabled />
            </div>
            <Button className="flex items-center gap-2" onClick={async () => {
              const resp = await savePreferences(preferences);
              if (resp.success) {
                (window as any).showToast?.({ type: "success", title: "Preferences Updated", message: "Your application preferences have been saved" });
              } else {
                (window as any).showToast?.({ type: "error", title: "Save failed", message: resp.message ?? "Please try again" });
              }
            }}>
              <Save className="w-4 h-4" />
              Save Application Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your data privacy and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Allow employers to find your profile</p>
                </div>
                <Switch checked={privacy.profileVisible} onCheckedChange={(checked) => handlePrivacyChange("profileVisible", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Usage Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the platform with anonymous usage data</p>
                </div>
                <Switch checked={privacy.analyticsEnabled} onCheckedChange={(checked) => handlePrivacyChange("analyticsEnabled", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">Share anonymized data with research partners</p>
                </div>
                <Switch checked={privacy.dataSharing} onCheckedChange={(checked) => handlePrivacyChange("dataSharing", checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive promotional emails and product updates</p>
                </div>
                <Switch checked={privacy.marketingEmails} onCheckedChange={(checked) => handlePrivacyChange("marketingEmails", checked)} />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4>Password & Security</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => { console.log("Opening password change modal"); }}>
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => { console.log("Setting up 2FA"); }}>
                  Enable Two-Factor Authentication
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const accountData = { profile, notifications, preferences, privacy, exportDate: new Date().toISOString() };
                    const dataStr = JSON.stringify(accountData, null, 2);
                    const blob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `account-data-${new Date().toISOString().split("T")[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Account Data
                </Button>
              </div>
            </div>
            <Button className="flex items-center gap-2" onClick={async () => {
              const resp = await savePrivacy(privacy);
              if (resp.success) {
                (window as any).showToast?.({ type: "success", title: "Privacy Updated", message: "Your privacy settings have been saved" });
              } else {
                (window as any).showToast?.({ type: "error", title: "Save failed", message: resp.message ?? "Please try again" });
              }
            }}>
              <Save className="w-4 h-4" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>Export, import, and manage your job search data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select value={preferences.exportFormat} onValueChange={(value) => handlePreferenceChange("exportFormat", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <h4>Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => { console.log("Exporting all user data"); alert("Data export will be emailed to you within 24 hours"); }}>
                  <Download className="w-4 h-4" />
                  Export All Data
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".json,.csv";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        console.log("Importing applications from:", file.name);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Import Applications
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => { console.log("Generating analytics report"); alert("Analytics report will be downloaded shortly"); }}>
                  <Download className="w-4 h-4" />
                  Export Analytics Report
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-destructive">Danger Zone</h4>
              <div className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete All Applications
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your job applications,
                        interviews, and related data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { console.log("Deleting all applications"); alert("All applications have been deleted"); }}>
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { console.log("Deleting user account"); alert("Account deletion initiated. You will be logged out."); }}>
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
