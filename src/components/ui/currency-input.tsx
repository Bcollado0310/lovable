import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toLocaleString('en-US'));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove non-numeric characters except dots and commas
      const numericValue = inputValue.replace(/[^0-9.,]/g, '');
      
      // Parse the value
      const parsedValue = parseFloat(numericValue.replace(/,/g, ''));
      
      if (isNaN(parsedValue)) {
        setDisplayValue("");
        onChange?.(undefined);
      } else {
        setDisplayValue(parsedValue.toLocaleString('en-US'));
        onChange?.(parsedValue);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          className={cn("pl-7", className)}
          value={displayValue}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };