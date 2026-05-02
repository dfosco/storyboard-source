import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const SheetTrigger = forwardRef(function SheetTrigger(props, ref) {
return <DialogPrimitive.Trigger ref={ref} data-slot="sheet-trigger" {...props} />;
});
export default SheetTrigger;
