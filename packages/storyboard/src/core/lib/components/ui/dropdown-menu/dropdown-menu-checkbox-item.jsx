import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, Minus } from "lucide-react";
import { cn } from "../../../utils/index.js";

const DropdownMenuCheckboxItem = forwardRef(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
return (
<DropdownMenuPrimitive.CheckboxItem
ref={ref}
data-slot="dropdown-menu-checkbox-item"
className={cn(
"focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-2 rounded-[4px] py-2 pr-8 pl-2.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
className
)}
checked={checked}
{...props}
>
<span
className="absolute right-2 flex items-center justify-center pointer-events-none"
data-slot="dropdown-menu-checkbox-item-indicator"
>
<DropdownMenuPrimitive.ItemIndicator>
{checked === "indeterminate" ? <Minus /> : <Check />}
</DropdownMenuPrimitive.ItemIndicator>
</span>
{children}
</DropdownMenuPrimitive.CheckboxItem>
);
});
export default DropdownMenuCheckboxItem;
