import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../utils/index.js";

const SelectTrigger = forwardRef(function SelectTrigger({ className, children, size = "default", ...props }, ref) {
return (
<SelectPrimitive.Trigger
ref={ref}
data-slot="select-trigger"
data-size={size}
className={cn(
"border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--sb--radius-md),10px)] *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
className
)}
{...props}
>
{children}
<SelectPrimitive.Icon asChild>
<ChevronDown className="text-muted-foreground size-4 pointer-events-none" />
</SelectPrimitive.Icon>
</SelectPrimitive.Trigger>
);
});
export default SelectTrigger;
