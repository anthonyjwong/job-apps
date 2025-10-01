import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
    className?: string;
    children: React.ReactNode;
}

export default function Card({ className, children }: CardProps) {
    return (
        <div
            className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
                className,
            )}
        >
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}