import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../../utils/index.js";

const DropdownMenuGroupHeading = forwardRef(function DropdownMenuGroupHeading({ className, inset, ...props }, ref) {
return (
<DropdownMenuPrimitive.Label
ref={ref}
data-slot="dropdown-menu-group-heading"
data-inset={inset}
className={cn("px-2 py-1.5 text-sm font-semibold data-[inset]:ps-8", className)}
{...props}
/>
);
});
export default DropdownMenuGroupHeading;
