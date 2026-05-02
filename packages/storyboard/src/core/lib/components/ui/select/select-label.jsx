import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const SelectLabel = forwardRef(function SelectLabel({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="select-label" className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)} {...props}>
{children}
</div>
);
});
export default SelectLabel;
