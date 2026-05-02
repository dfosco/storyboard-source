import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "../../../utils/index.js";

const DropdownMenuRadioItem = forwardRef(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
return (
<DropdownMenuPrimitive.RadioItem
ref={ref}
data-slot="dropdown-menu-radio-item"
className={cn(
"focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
className
)}
{...props}
>
<span
className="absolute right-2 flex items-center justify-center pointer-events-none"
data-slot="dropdown-menu-radio-item-indicator"
>
<DropdownMenuPrimitive.ItemIndicator>
<Check />
</DropdownMenuPrimitive.ItemIndicator>
</span>
{children}
</DropdownMenuPrimitive.RadioItem>
);
});
export default DropdownMenuRadioItem;
