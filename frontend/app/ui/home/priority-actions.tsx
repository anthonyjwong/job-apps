import { fetchPriorityActionsData } from "@/app/lib/data";
import Card from "@/app/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityActions } from "@/lib/types";
import { AlertCircle, Calendar, CheckCircle, FileText, MessageSquare } from "lucide-react"; // ensure icons imported
import Link from "next/link";
import ActionCard from "./action-card";

export default async function PriorityActionsOverview() {
    const { interviews, assessments, stale }: PriorityActions = await fetchPriorityActionsData();
    const totalActionItems = interviews.length + assessments.length + stale.length;

    return (
        <>
            {/* Header with Opportunity Spotlight */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h1>Good morning, AJ!</h1>
                    {totalActionItems > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {totalActionItems} action{totalActionItems === 1 ? '' : 's'} needed
                        </Badge>
                    )}
                </div>

                <p className="text-muted-foreground">
                    Stay on top of priority actions and application momentum.
                </p>
            </div>

            {/* Action Items Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/applications?status=interview">
                    <ActionCard
                        title="Interviews"
                        count={interviews.length}
                        emptyText="None scheduled"
                        nonEmptySuffix="upcoming"
                        icon={<Calendar className="w-5 h-5" />}
                        nextLabel="Next:"
                        nextPrimary={interviews[0]?.company}
                        nextSecondary={interviews.length > 0 ? 'INTERVIEW DATE NOT IMPLEMENTED' : undefined}
                    />
                </Link>

                <Link href="/applications?status=assessment">
                    <ActionCard
                        title="Assessments"
                        count={assessments.length}
                        emptyText="None pending"
                        nonEmptySuffix="pending"
                        icon={<FileText className="w-5 h-5" />}
                        nextLabel="Due:"
                        nextPrimary={assessments[0]?.company}
                        nextSecondary={assessments.length > 0 ? 'NOT IMPLEMENTED' : undefined}
                    />
                </Link>

                <Link href="/applications?status=stale">
                    <ActionCard
                        title="Follow-ups"
                        count={stale.length}
                        emptyText="All current"
                        nonEmptySuffix="overdue"
                        icon={<MessageSquare className="w-5 h-5" />}
                        nextLabel="Oldest:"
                        nextPrimary={stale[0]?.company}
                        nextSecondary={stale.length > 0 ? 'NOT IMPLEMENTED (updated_at)' : undefined}
                    />
                </Link>
            </div>

            {/* Success State when all caught up */}
            {/* {totalActionItems === 0 && ( */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800 dark:text-green-200">All caught up!</p>
                        <p className="text-sm text-green-600 dark:text-green-400">No urgent actions needed. Keep up the great work!</p>
                    </div>
                </div>
            </Card>
            {/* )} */}
        </>
    );
}