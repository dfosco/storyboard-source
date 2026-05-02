import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export default function Tooltip({ children, ...props }) {
return (
<TooltipPrimitive.Provider delayDuration={50}>
<TooltipPrimitive.Root {...props}>
{children}
</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
);
}
