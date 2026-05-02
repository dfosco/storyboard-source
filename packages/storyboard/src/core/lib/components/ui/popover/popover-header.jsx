import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const PopoverHeader = forwardRef(function PopoverHeader({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="popover-header" className={cn("flex flex-col gap-0.5 text-sm", className)} {...props}>
{children}
</div>
);
});
export default PopoverHeader;
