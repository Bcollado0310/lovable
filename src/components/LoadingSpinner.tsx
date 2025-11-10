import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message = "Loading...", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <div className="gradient-text text-lg">{message}</div>
    </div>
  );
}