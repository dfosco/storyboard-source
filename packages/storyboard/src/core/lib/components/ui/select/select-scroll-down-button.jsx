import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../utils/index.js";

const SelectScrollDownButton = forwardRef(function SelectScrollDownButton({ className, ...props }, ref) {
return (
<SelectPrimitive.ScrollDownButton
ref={ref}
data-slot="select-scroll-down-button"
className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)}
{...props}
>
<ChevronDown />
</SelectPrimitive.ScrollDownButton>
);
});
export default SelectScrollDownButton;
