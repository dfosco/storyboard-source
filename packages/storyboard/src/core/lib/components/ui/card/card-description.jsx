import { forwardRef } from "react";
import { cn } from "../../../utils/index.js";

const CardDescription = forwardRef(function CardDescription({ className, children, ...props }, ref) {
return (
<p ref={ref} data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props}>
{children}
</p>
);
});
export default CardDescription;
