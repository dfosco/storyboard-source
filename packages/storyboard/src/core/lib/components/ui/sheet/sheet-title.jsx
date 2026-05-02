import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const SheetTitle = forwardRef(function SheetTitle({ className, ...props }, ref) {
return (
<DialogPrimitive.Title
ref={ref}
data-slot="sheet-title"
className={cn("text-foreground text-base font-medium", className)}
{...props}
/>
);
});
export default SheetTitle;
