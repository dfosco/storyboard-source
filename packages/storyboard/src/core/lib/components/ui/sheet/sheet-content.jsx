import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import SheetOverlay from "./sheet-overlay.jsx";
import { cn } from "../../../utils/index.js";
import { Button } from "../../../components/ui/button/index.js";
import { X } from "lucide-react";

const SheetContent = forwardRef(function SheetContent({ className, side = "right", showCloseButton = true, children, ...props }, ref) {
return (
<DialogPrimitive.Portal>
<SheetOverlay />
<DialogPrimitive.Content
ref={ref}
data-slot="sheet-content"
data-side={side}
className={cn(
"bg-background fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=bottom]:data-[state=open]:slide-in-from-bottom-10 data-[side=left]:data-[state=open]:slide-in-from-left-10 data-[side=right]:data-[state=open]:slide-in-from-right-10 data-[side=top]:data-[state=open]:slide-in-from-top-10 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-10 data-[side=left]:data-[state=closed]:slide-out-to-left-10 data-[side=right]:data-[state=closed]:slide-out-to-right-10 data-[side=top]:data-[state=closed]:slide-out-to-top-10",
className
)}
{...props}
>
{children}
{showCloseButton && (
<DialogPrimitive.Close asChild data-slot="sheet-close">
<Button variant="ghost" className="absolute top-3 right-3" size="icon-sm">
<X />
<span className="sr-only">Close</span>
</Button>
</DialogPrimitive.Close>
)}
</DialogPrimitive.Content>
</DialogPrimitive.Portal>
);
});
export default SheetContent;
