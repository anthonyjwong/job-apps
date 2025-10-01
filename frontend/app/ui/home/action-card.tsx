"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Color theme mappings
const colorThemes = {
    "Interviews":{
        activeBorder: "border-blue-200 dark:border-blue-800",
        activeBg: "bg-blue-50/50 dark:bg-blue-950/20",
        iconBg: "bg-blue-500",
        badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    "Assessments": {
        activeBorder: "border-orange-200 dark:border-orange-800",
        activeBg: "bg-orange-50/50 dark:bg-orange-950/20",
        iconBg: "bg-orange-500",
        badgeBg: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    "Follow-ups": {
        activeBorder: "border-yellow-200 dark:border-yellow-800",
        activeBg: "bg-yellow-50/50 dark:bg-yellow-950/20",
        iconBg: "bg-yellow-500",
        badgeBg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
};

export type ActionCardProps = {
    title: string;
    count: number;
    emptyText: string; // text when count === 0
    nonEmptySuffix: string; // e.g. "upcoming", "pending", "overdue"
    icon: ReactNode; // icon element sized ~ w-5 h-5 (we set color)
    nextLabel?: string; // e.g. "Next:" "Due:" "Oldest:"
    nextPrimary?: string; // first line inside detail box (usually company)
    nextSecondary?: string; // second line (e.g. date)
    showDetail?: boolean; // default true
};

export function ActionCard({
    title,
    count,
    emptyText,
    nonEmptySuffix,
    icon,
    nextLabel,
    nextPrimary,
    nextSecondary,
    showDetail = true,
}: ActionCardProps) {
    const theme = colorThemes[title as keyof typeof colorThemes];

    return (
        <div
            className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                count > 0 && theme.activeBorder,
                count > 0 && theme.activeBg
            )}
        >
            <div className="px-6 [&:last-child]:pb-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                count > 0 ? theme.iconBg : "bg-muted"
                            )}
                        >
                            {/* Icon color adjusts depending on count */}
                            <span
                                className={cn(
                                    "w-5 h-5 flex items-center justify-center",
                                    count > 0 ? "text-white" : "text-muted-foreground"
                                )}
                            >
                                {icon}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium">{title}</p>
                            <p className="text-sm text-muted-foreground">
                                {count === 0 ? emptyText : `${count} ${nonEmptySuffix}`}
                            </p>
                        </div>
                    </div>
                    {count > 0 && (
                        <Badge variant="secondary" className={theme.badgeBg}>
                            {count}
                        </Badge>
                    )}
                </div>
                {showDetail && count > 0 && (nextPrimary || nextSecondary) && (
                    <div className="mt-3 p-2 bg-white/50 dark:bg-white/5 rounded border">
                        {nextPrimary && (
                            <p className="text-xs text-muted-foreground">
                                {nextLabel ? `${nextLabel} ${nextPrimary}` : nextPrimary}
                            </p>
                        )}
                        {nextSecondary && (
                            <p className="text-xs font-medium">{nextSecondary}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActionCard;
