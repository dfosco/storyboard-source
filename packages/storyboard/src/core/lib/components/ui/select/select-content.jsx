import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import SelectScrollUpButton from "./select-scroll-up-button.jsx";
import SelectScrollDownButton from "./select-scroll-down-button.jsx";
import { cn } from "../../../utils/index.js";

const SelectContent = forwardRef(function SelectContent({ className, children, sideOffset = 4, position = "popper", ...props }, ref) {
return (
<SelectPrimitive.Portal>
<SelectPrimitive.Content
ref={ref}
data-slot="select-content"
sideOffset={sideOffset}
position={position}
className={cn(
"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg shadow-md ring-1 duration-100 relative isolate z-50 overflow-x-hidden overflow-y-auto",
className
)}
{...props}
>
<SelectScrollUpButton />
<SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1">
{children}
</SelectPrimitive.Viewport>
<SelectScrollDownButton />
</SelectPrimitive.Content>
</SelectPrimitive.Portal>
);
});
export default SelectContent;
