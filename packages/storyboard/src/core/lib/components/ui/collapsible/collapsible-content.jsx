import { forwardRef } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const CollapsibleContent = forwardRef(function CollapsibleContent({ ...props }, ref) {
return <CollapsiblePrimitive.Content ref={ref} data-slot="collapsible-content" {...props} />;
});
export default CollapsibleContent;
