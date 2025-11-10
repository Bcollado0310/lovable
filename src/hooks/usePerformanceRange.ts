import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import type { DateRange } from "@/components/ui/range-selector";

export function usePerformanceRange() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentRange = (searchParams.get("range") as DateRange) || "all";
  
  const setRange = useCallback((range: DateRange) => {
    const newParams = new URLSearchParams(searchParams);
    if (range === "all") {
      newParams.delete("range");
    } else {
      newParams.set("range", range);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    range: currentRange,
    setRange
  };
}

export function calculateDateRange(range: DateRange, firstActivityDate?: Date): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Default first activity date if not provided
  const defaultFirstActivity = new Date(currentYear - 1, 0, 1);
  const firstActivity = firstActivityDate || defaultFirstActivity;
  
  let start: Date;
  
  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "1m":
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case "3m":
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      break;
    case "6m":
      start = new Date(now);
      start.setDate(start.getDate() - 182);
      break;
    case "1y":
      start = new Date(now);
      start.setDate(start.getDate() - 365);
      break;
    case "ytd":
      start = new Date(currentYear, 0, 1);
      break;
    case "all":
    default:
      start = firstActivity;
      break;
  }
  
  // Clamp start to first activity date to avoid empty ranges
  if (start < firstActivity) {
    start = firstActivity;
  }
  
  return { start, end: now };
}
