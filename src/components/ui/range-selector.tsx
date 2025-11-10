import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DateRange = "today" | "1m" | "3m" | "6m" | "1y" | "ytd" | "all";

interface RangeSelectorProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
  className?: string;
}

const RANGE_OPTIONS = [
  { value: "today" as const, label: "Today" },
  { value: "1m" as const, label: "1M" },
  { value: "3m" as const, label: "3M" },
  { value: "6m" as const, label: "6M" },
  { value: "1y" as const, label: "1Y" },
  { value: "ytd" as const, label: "YTD" },
  { value: "all" as const, label: "Since Inception" }
];

export function RangeSelector({ value, onValueChange, className }: RangeSelectorProps) {
  const isFiltered = value !== "all";
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`${className} ${isFiltered ? 'ring-2 ring-primary/30 bg-primary/5' : ''} transition-all duration-200`}>
        <SelectValue placeholder="Time range" />
      </SelectTrigger>
      <SelectContent className="bg-background border-border z-50">
        {RANGE_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value} className="bg-background hover:bg-muted">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
