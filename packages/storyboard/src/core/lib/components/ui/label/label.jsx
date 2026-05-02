import { forwardRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../../utils/index.js";

const Label = forwardRef(function Label({ className, ...props }, ref) {
return (
<LabelPrimitive.Root
ref={ref}
data-slot="label"
className={cn(
"gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
className
)}
{...props}
/>
);
});

export default Label;
