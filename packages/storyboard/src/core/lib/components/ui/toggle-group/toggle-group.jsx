import { forwardRef, createContext, useContext, useMemo } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../../utils/index.js";

export const ToggleGroupContext = createContext({
variant: "default",
size: "default",
spacing: 0,
orientation: "horizontal",
});

export function useToggleGroupCtx() {
return useContext(ToggleGroupContext);
}

const ToggleGroup = forwardRef(function ToggleGroup(
{ className, variant = "default", size = "default", spacing = 0, orientation = "horizontal", children, ...props },
ref
) {
const ctx = useMemo(() => ({ variant, size, spacing, orientation }), [variant, size, spacing, orientation]);

return (
<ToggleGroupContext.Provider value={ctx}>
<ToggleGroupPrimitive.Root
ref={ref}
orientation={orientation}
data-slot="toggle-group"
data-variant={variant}
data-size={size}
data-spacing={spacing}
style={{ '--sb--gap': spacing }}
className={cn(
"rounded-lg data-[size=sm]:rounded-[min(var(--sb--radius-md),10px)] group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--sb--gap))] data-vertical:flex-col data-vertical:items-stretch",
className
)}
{...props}
>
{children}
</ToggleGroupPrimitive.Root>
</ToggleGroupContext.Provider>
);
});
export default ToggleGroup;
