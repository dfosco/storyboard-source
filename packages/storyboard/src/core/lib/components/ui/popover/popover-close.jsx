import { forwardRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const PopoverClose = forwardRef(function PopoverClose(props, ref) {
return <PopoverPrimitive.Close ref={ref} data-slot="popover-close" {...props} />;
});
export default PopoverClose;
