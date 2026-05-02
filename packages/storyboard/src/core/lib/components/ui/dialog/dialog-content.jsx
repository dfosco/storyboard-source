import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import DialogOverlay from "./dialog-overlay.jsx";
import { cn } from "../../../utils/index.js";
import { Button } from "../../../components/ui/button/index.js";
import { X } from "lucide-react";

const DialogContent = forwardRef(function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
return (
<DialogPrimitive.Portal>
<DialogOverlay />
<DialogPrimitive.Content
ref={ref}
data-slot="dialog-content"
className={cn(
"font-sans bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
className
)}
{...props}
>
{children}
{showCloseButton && (
<DialogPrimitive.Close asChild data-slot="dialog-close">
<Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
<X />
<span className="sr-only">Close</span>
</Button>
</DialogPrimitive.Close>
)}
</DialogPrimitive.Content>
</DialogPrimitive.Portal>
);
});
export default DialogContent;
