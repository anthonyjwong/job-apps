import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface HeaderProps extends React.ComponentProps<"div"> {
    Icon?: LucideIcon;
    text: string;
    subtext: string;
}

export default function Header({ Icon, text, subtext }: HeaderProps) {
    return (
        <div className="grid gap-1.5 pb-6">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-primary" aria-hidden="true" />}
                {text}
            </div>
            <div className="text-muted-foreground">
                {subtext}
            </div>
        </div>
    );
}