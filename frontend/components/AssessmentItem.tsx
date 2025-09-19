"use client";

interface AssessmentItemProps {
  company: string;
  position: string;
  onClick?: () => void;
}

export function AssessmentItem({ company, position, onClick }: AssessmentItemProps) {
  return (
    <div 
      className="bg-muted rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          // Default action - could open assessment details
          console.log(`Opening assessment details for ${company} - ${position}`);
        }
      }}
    >
      <div className="font-medium text-sm mb-1">{company}</div>
      <div className="text-sm text-muted-foreground">{position}</div>
    </div>
  );
}