import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../../../utils/index.js";

const SelectSeparator = forwardRef(function SelectSeparator({ className, ...props }, ref) {
return (
<SelectPrimitive.Separator
ref={ref}
data-slot="select-separator"
className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
{...props}
/>
);
});
export default SelectSeparator;
