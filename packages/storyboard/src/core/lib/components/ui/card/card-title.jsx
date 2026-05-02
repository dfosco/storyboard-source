import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardTitle = forwardRef(function CardTitle({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="card-title" className={cn("text-base leading-snug font-medium group-data-[size=sm]/card:text-sm", className)} {...props}>
{children}
</div>
);
});
export default CardTitle;
