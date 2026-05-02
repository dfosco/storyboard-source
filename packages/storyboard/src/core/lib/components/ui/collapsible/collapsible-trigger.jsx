import { forwardRef } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const CollapsibleTrigger = forwardRef(function CollapsibleTrigger({ ...props }, ref) {
return <CollapsiblePrimitive.Trigger ref={ref} data-slot="collapsible-trigger" {...props} />;
});
export default CollapsibleTrigger;
