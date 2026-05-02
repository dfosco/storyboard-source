import { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipTrigger = forwardRef(function TooltipTrigger({ asChild, children, ...props }, ref) {
if (asChild) {
return (
<TooltipPrimitive.Trigger ref={ref} asChild {...props}>
{children}
</TooltipPrimitive.Trigger>
);
}
return (
<TooltipPrimitive.Trigger ref={ref} asChild {...props}>
<span
tabIndex={-1}
style={{ display: "inline-flex" }}
>
{children}
</span>
</TooltipPrimitive.Trigger>
);
});
export default TooltipTrigger;
