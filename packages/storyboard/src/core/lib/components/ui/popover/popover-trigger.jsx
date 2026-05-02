import { forwardRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../utils/index.js";

const PopoverTrigger = forwardRef(function PopoverTrigger({ className, ...props }, ref) {
return <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" className={cn("", className)} {...props} />;
});
export default PopoverTrigger;
