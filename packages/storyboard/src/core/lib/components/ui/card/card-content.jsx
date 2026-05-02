import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardContent = forwardRef(function CardContent({ className, children, ...props }, ref) {
return (
<div ref={ref} data-slot="card-content" className={cn("px-4 group-data-[size=sm]/card:px-3", className)} {...props}>
{children}
</div>
);
});
export default CardContent;
