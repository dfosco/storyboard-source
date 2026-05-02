import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

const DropdownMenuRadioGroup = forwardRef(function DropdownMenuRadioGroup(props, ref) {
return <DropdownMenuPrimitive.RadioGroup ref={ref} data-slot="dropdown-menu-radio-group" {...props} />;
});
export default DropdownMenuRadioGroup;
