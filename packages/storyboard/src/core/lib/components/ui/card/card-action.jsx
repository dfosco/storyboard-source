import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardAction = forwardRef(function CardAction({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="card-action" className={cn("cn-card-action col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props}>
{children}
</div>
);
});
export default CardAction;
