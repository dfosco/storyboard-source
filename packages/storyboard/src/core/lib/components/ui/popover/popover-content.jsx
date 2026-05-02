import { forwardRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../utils/index.js";

const PopoverContent = forwardRef(function PopoverContent({ className, sideOffset = 4, align = "center", ...props }, ref) {
return (
<PopoverPrimitive.Portal>
<PopoverPrimitive.Content
ref={ref}
data-slot="popover-content"
sideOffset={sideOffset}
align={align}
className={cn(
"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 duration-100 z-50 w-72 origin-(--transform-origin) outline-hidden",
className
)}
{...props}
/>
</PopoverPrimitive.Portal>
);
});
export default PopoverContent;
