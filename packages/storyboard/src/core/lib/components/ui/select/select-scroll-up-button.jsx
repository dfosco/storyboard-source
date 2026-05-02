import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronUp } from "lucide-react";
import { cn } from "../../../utils/index.js";

const SelectScrollUpButton = forwardRef(function SelectScrollUpButton({ className, ...props }, ref) {
return (
<SelectPrimitive.ScrollUpButton
ref={ref}
data-slot="select-scroll-up-button"
className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)}
{...props}
>
<ChevronUp />
</SelectPrimitive.ScrollUpButton>
);
});
export default SelectScrollUpButton;
