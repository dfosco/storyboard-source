import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const DialogHeader = forwardRef(function DialogHeader({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="dialog-header" className={cn("gap-2 flex flex-col", className)} {...props}>
{children}
</div>
);
});
export default DialogHeader;
