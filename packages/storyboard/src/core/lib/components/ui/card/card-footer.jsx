import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardFooter = forwardRef(function CardFooter({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="card-footer" className={cn("bg-muted/50 rounded-b-xl border-t p-4 group-data-[size=sm]/card:p-3 flex items-center", className)} {...props}>
{children}
</div>
);
});
export default CardFooter;
