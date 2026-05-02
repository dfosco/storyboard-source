import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
import { cn } from "../../../utils/index.js";

const SelectItem = forwardRef(function SelectItem({ className, children, ...props }, ref) {
return (
<SelectPrimitive.Item
ref={ref}
data-slot="select-item"
className={cn(
"focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 focus:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground focus:text-accent-foreground relative flex w-full cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
className
)}
{...props}
>
<span className="absolute end-2 flex size-3.5 items-center justify-center">
<SelectPrimitive.ItemIndicator>
<Check className="cn-select-item-indicator-icon" />
</SelectPrimitive.ItemIndicator>
</span>
<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
</SelectPrimitive.Item>
);
});
export default SelectItem;
