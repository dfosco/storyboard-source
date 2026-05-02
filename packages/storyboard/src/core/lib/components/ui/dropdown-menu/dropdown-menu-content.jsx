import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../../utils/index.js";

const DropdownMenuContent = forwardRef(function DropdownMenuContent({ className, sideOffset = 8, align = "start", ...props }, ref) {
return (
<DropdownMenuPrimitive.Portal>
<DropdownMenuPrimitive.Content
ref={ref}
data-slot="dropdown-menu-content"
sideOffset={sideOffset}
align={align}
className={cn(
"font-sans data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 z-[10000] bg-popover border-3 border-border text-popover-foreground fill-popover-foreground min-w-40 rounded-xl p-2 shadow-xl duration-100 overflow-x-hidden overflow-y-auto",
className
)}
{...props}
/>
</DropdownMenuPrimitive.Portal>
);
});
export default DropdownMenuContent;
