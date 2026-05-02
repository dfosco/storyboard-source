import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const PanelContent = forwardRef(function PanelContent({ className, children, ...props }, ref) {
return (
<DialogPrimitive.Portal>
<DialogPrimitive.Content
ref={ref}
data-slot="panel-content"
onInteractOutside={(e) => e.preventDefault()}
onFocusOutside={(e) => e.preventDefault()}
className={cn(
"font-sans fixed z-[10000] bottom-28 right-6 w-[400px] max-h-[90vh] flex flex-col",
"bg-popover text-popover-foreground border-3 border-slate-400",
"rounded-xl shadow-xl overflow-x-hidden overflow-y-auto",
"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4",
"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4",
"duration-150",
className
)}
{...props}
>
{children}
</DialogPrimitive.Content>
</DialogPrimitive.Portal>
);
});
export default PanelContent;
