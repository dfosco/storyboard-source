import { forwardRef } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = forwardRef(function Collapsible({ ...props }, ref) {
return <CollapsiblePrimitive.Root ref={ref} data-slot="collapsible" {...props} />;
});
export default Collapsible;
