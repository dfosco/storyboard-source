import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const DialogClose = forwardRef(function DialogClose({ type = "button", ...props }, ref) {
return <DialogPrimitive.Close ref={ref} data-slot="dialog-close" type={type} {...props} />;
});
export default DialogClose;
