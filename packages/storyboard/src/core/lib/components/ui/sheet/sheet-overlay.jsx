import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const SheetOverlay = forwardRef(function SheetOverlay({ className, ...props }, ref) {
return (
<DialogPrimitive.Overlay
ref={ref}
data-slot="sheet-overlay"
className={cn("bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50", className)}
{...props}
/>
);
});
export default SheetOverlay;
