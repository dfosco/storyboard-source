import { forwardRef } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../../../utils/index.js";

const Separator = forwardRef(function Separator({ className, orientation = "horizontal", decorative = true, "data-slot": dataSlot = "separator", ...props }, ref) {
return (
<SeparatorPrimitive.Root
ref={ref}
data-slot={dataSlot}
decorative={decorative}
orientation={orientation}
className={cn(
"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
"data-[orientation=vertical]:h-full",
className
)}
{...props}
/>
);
});

export default Separator;
