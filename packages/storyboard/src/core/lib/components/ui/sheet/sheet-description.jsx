import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const SheetDescription = forwardRef(function SheetDescription({ className, ...props }, ref) {
return (
<DialogPrimitive.Description
ref={ref}
data-slot="sheet-description"
className={cn("text-muted-foreground text-sm", className)}
{...props}
/>
);
});
export default SheetDescription;
