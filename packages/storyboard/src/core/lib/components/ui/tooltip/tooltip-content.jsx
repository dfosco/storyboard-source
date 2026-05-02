import { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../../utils/index.js";

const TooltipContent = forwardRef(function TooltipContent({ className, sideOffset = 8, ...props }, ref) {
return (
<TooltipPrimitive.Portal>
<TooltipPrimitive.Content
ref={ref}
data-slot="tooltip-content"
sideOffset={sideOffset}
className={cn(
"font-sans bg-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg z-[10001] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
className
)}
{...props}
/>
</TooltipPrimitive.Portal>
);
});
export default TooltipContent;
