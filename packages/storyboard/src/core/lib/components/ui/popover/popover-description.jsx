import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const PopoverDescription = forwardRef(function PopoverDescription({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="popover-description" className={cn("text-muted-foreground", className)} {...props}>
{children}
</div>
);
});
export default PopoverDescription;
