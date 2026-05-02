import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const DialogTrigger = forwardRef(function DialogTrigger({ type = "button", ...props }, ref) {
return <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" type={type} {...props} />;
});
export default DialogTrigger;
