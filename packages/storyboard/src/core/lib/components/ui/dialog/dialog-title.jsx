import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const DialogTitle = forwardRef(function DialogTitle({ className, ...props }, ref) {
return (
<DialogPrimitive.Title
ref={ref}
data-slot="dialog-title"
className={cn("text-base leading-none font-medium", className)}
{...props}
/>
);
});
export default DialogTitle;
