import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";
import { Button } from "../../../components/ui/button/index.js";

const DialogFooter = forwardRef(function DialogFooter({ className, children, showCloseButton = false, ...props }, ref) {
return (
<div
ref={ref}
data-slot="dialog-footer"
className={cn("bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
{...props}
>
{children}
{showCloseButton && (
<DialogPrimitive.Close asChild>
<Button variant="outline">Close</Button>
</DialogPrimitive.Close>
)}
</div>
);
});
export default DialogFooter;
