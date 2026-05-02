import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const SheetClose = forwardRef(function SheetClose(props, ref) {
return <DialogPrimitive.Close ref={ref} data-slot="sheet-close" {...props} />;
});
export default SheetClose;
