import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const SheetFooter = forwardRef(function SheetFooter({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="sheet-footer" className={cn("gap-2 p-4 mt-auto flex flex-col", className)} {...props}>
{children}
</div>
);
});
export default SheetFooter;
