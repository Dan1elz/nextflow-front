import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends React.ComponentProps<
  typeof CheckboxPrimitive.Root
> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      internalRef.current = node;
    },
    [ref]
  );

  React.useEffect(() => {
    if (internalRef.current && indeterminate !== undefined) {
      internalRef.current.setAttribute(
        "data-indeterminate",
        String(indeterminate)
      );
      internalRef.current.ariaChecked = indeterminate ? "mixed" : null;
    }
  }, [indeterminate]);

  return (
    <CheckboxPrimitive.Root
      ref={combinedRef}
      data-slot="checkbox"
      className={cn(
        "peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[indeterminate=true]:bg-primary/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
