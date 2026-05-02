import { forwardRef } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { useToggleGroupCtx } from "./toggle-group.jsx";
import { cn } from "../../../utils/index.js";
import { toggleVariants } from "../../../components/ui/toggle/index.js";

const ToggleGroupItem = forwardRef(function ToggleGroupItem({ className, variant, size, ...props }, ref) {
const ctx = useToggleGroupCtx();

return (
<ToggleGroupPrimitive.Item
ref={ref}
data-slot="toggle-group-item"
data-variant={ctx.variant || variant}
data-size={ctx.size || size}
data-spacing={ctx.spacing}
className={cn(
"group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg shrink-0 focus:z-10 focus-visible:z-10 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
toggleVariants({
variant: ctx.variant || variant,
size: ctx.size || size,
}),
className
)}
{...props}
/>
);
});
export default ToggleGroupItem;
