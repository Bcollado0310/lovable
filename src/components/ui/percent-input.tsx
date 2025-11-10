import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PercentInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove non-numeric characters except dots
      const numericValue = inputValue.replace(/[^0-9.]/g, '');
      
      if (numericValue === "") {
        setDisplayValue("");
        onChange?.(undefined);
        return;
      }

      // Parse the value
      const parsedValue = parseFloat(numericValue);
      
      if (isNaN(parsedValue)) {
        setDisplayValue("");
        onChange?.(undefined);
      } else {
        // Limit to 2 decimal places and reasonable range
        const limitedValue = Math.min(Math.max(parsedValue, 0), 100);
        setDisplayValue(numericValue);
        onChange?.(limitedValue);
      }
    };

    return (
      <div className="relative">
        <Input
          type="text"
          className={cn("pr-7", className)}
          value={displayValue}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          %
        </span>
      </div>
    );
  }
);

PercentInput.displayName = "PercentInput";

export { PercentInput };