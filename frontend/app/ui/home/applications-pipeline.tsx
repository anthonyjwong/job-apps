import { fetchMockApplications } from "@/app/lib/data";
import { JobClassificationBadge } from "@/components/JobClassificationBadge";
import { Button } from "@/components/ui/button";
import { Application } from "@/lib/types";
import { ArrowRight, Brain, Plus, Send } from "lucide-react";
import Link from "next/link";
import Card from "../card";
import Header from "../header";

export default async function ApplicationsPipelineOverview() {
    const applications: Application[] = await fetchMockApplications();

    return (
        <>
            <Card>
                <Header Icon={Send} text="Application Pipeline" subtext="Ready-to-submit applications to maintain your job search velocity" />
                <div>
                    {applications.length === 0 ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Plus className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No applications ready</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Save jobs from the discovery page to get AI-prepared applications
                                </p>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm">
                                        <span className="font-medium text-primary">1,847 new opportunities</span> waiting to be discovered
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        AI-classified and ready for your profile
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {applications.length} applications ready to review and submit
                                </p>
                                <Link href="/applications/manage">
                                    <Button size="sm" variant="ghost">
                                        Manage apps
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid gap-3">
                                {applications.map((app, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <JobClassificationBadge classification={app.classification || "safety"} size="sm" />
                                            <div>
                                                <p className="font-medium">{app.position}</p>
                                                <p className="text-sm text-muted-foreground">{app.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm">
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Discover More - Subtle Footer */}
                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        <span className="font-medium text-primary">1,847 more opportunities</span> available
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs"
                                    >
                                        Discover More
                                        <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
}
