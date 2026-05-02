import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardHeader = forwardRef(function CardHeader({ className, children, ...props }, ref) {
return (
<div
ref={ref}
data-slot="card-header"
className={cn(
"gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
className
)}
{...props}
>
{children}
</div>
);
});
export default CardHeader;
