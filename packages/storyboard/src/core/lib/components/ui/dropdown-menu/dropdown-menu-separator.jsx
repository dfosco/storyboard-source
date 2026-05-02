import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../../utils/index.js";

const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
return (
<DropdownMenuPrimitive.Separator
ref={ref}
data-slot="dropdown-menu-separator"
className={cn("bg-border -mx-1.5 my-1 h-px", className)}
{...props}
/>
);
});
export default DropdownMenuSeparator;
