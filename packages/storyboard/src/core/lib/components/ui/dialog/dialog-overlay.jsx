import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const DialogOverlay = forwardRef(function DialogOverlay({ className, ...props }, ref) {
return (
<DialogPrimitive.Overlay
ref={ref}
data-slot="dialog-overlay"
className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className)}
{...props}
/>
);
});
export default DialogOverlay;
