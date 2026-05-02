import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const PopoverTitle = forwardRef(function PopoverTitle({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="popover-title" className={cn("font-medium", className)} {...props}>
{children}
</div>
);
});
export default PopoverTitle;
