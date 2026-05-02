import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../utils/index.js";

const DialogDescription = forwardRef(function DialogDescription({ className, ...props }, ref) {
return (
<DialogPrimitive.Description
ref={ref}
data-slot="dialog-description"
className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
{...props}
/>
);
});
export default DialogDescription;
