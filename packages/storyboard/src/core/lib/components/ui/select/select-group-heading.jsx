import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../../../utils/index.js";

const SelectGroupHeading = forwardRef(function SelectGroupHeading({ className, children, ...props }, ref) {
return (
<SelectPrimitive.Label
ref={ref}
data-slot="select-group-heading"
className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
{...props}
>
{children}
</SelectPrimitive.Label>
);
});
export default SelectGroupHeading;
