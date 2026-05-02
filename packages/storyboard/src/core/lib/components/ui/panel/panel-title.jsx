import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const PanelTitle = forwardRef(function PanelTitle({ className, children, ...props }, ref) {
return (
<DialogPrimitive.Title ref={ref} data-slot="panel-title" className={cn("text-sm font-semibold", className)} {...props}>
{children}
</DialogPrimitive.Title>
);
});
export default PanelTitle;
