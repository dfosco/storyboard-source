import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

const DropdownMenuGroup = forwardRef(function DropdownMenuGroup(props, ref) {
return <DropdownMenuPrimitive.Group ref={ref} data-slot="dropdown-menu-group" {...props} />;
});
export default DropdownMenuGroup;
