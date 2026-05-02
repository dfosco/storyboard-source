import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

// Radix doesn't have a CheckboxGroup — use a plain Group as container
const DropdownMenuCheckboxGroup = forwardRef(function DropdownMenuCheckboxGroup(props, ref) {
return <DropdownMenuPrimitive.Group ref={ref} data-slot="dropdown-menu-checkbox-group" {...props} />;
});
export default DropdownMenuCheckboxGroup;
