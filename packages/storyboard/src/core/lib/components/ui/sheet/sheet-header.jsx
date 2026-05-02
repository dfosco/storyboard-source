import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const SheetHeader = forwardRef(function SheetHeader({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="sheet-header" className={cn("gap-0.5 p-4 flex flex-col", className)} {...props}>
{children}
</div>
);
});
export default SheetHeader;
