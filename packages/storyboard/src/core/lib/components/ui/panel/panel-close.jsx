import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "../../../components/ui/button/index.js";
import { X } from "lucide-react";

const PanelClose = forwardRef(function PanelClose({ className, ...props }, ref) {
return (
<DialogPrimitive.Close asChild data-slot="panel-close">
<Button ref={ref} variant="ghost" size="icon-sm" className={className} {...props}>
<X />
<span className="sr-only">Close</span>
</Button>
</DialogPrimitive.Close>
);
});
export default PanelClose;
