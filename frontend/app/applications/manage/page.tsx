import { fetchMockApplications } from "@/app/lib/data";
import Card from "@/app/ui/card";
import { JobClassificationBadge } from "@/components/JobClassificationBadge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, RefreshCw } from "lucide-react";

export default async function ApplicationsPage() {
    const mockApplications = await fetchMockApplications();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1>Application Management</h1>
                    <p className="text-muted-foreground">
                        Review, customize, and submit your AI-prepared applications
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Application Cards */}
            <div className="space-y-4">
                {mockApplications.map((application) => (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-medium">{application.position}</h3>
                                    <JobClassificationBadge classification={application.classification} />
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="font-medium text-foreground">{application.company}</span>
                                    <span>{application.location}</span>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">
                                    {application.notes}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                {/* <Button
                                    size="sm"
                                    onClick={() => handleSubmitApplication(application.id)}
                                    disabled={isSubmitting === application.id}
                                >
                                    {isSubmitting === application.id ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit
                                        </>
                                    )}
                                </Button> */}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}