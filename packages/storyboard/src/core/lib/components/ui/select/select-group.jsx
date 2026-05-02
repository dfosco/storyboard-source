import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../../../utils/index.js";

const SelectGroup = forwardRef(function SelectGroup({ className, ...props }, ref) {
return (
<SelectPrimitive.Group
ref={ref}
data-slot="select-group"
className={cn("scroll-my-1 p-1", className)}
{...props}
/>
);
});
export default SelectGroup;
