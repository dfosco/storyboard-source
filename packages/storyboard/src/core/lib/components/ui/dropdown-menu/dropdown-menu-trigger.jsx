import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

const DropdownMenuTrigger = forwardRef(function DropdownMenuTrigger({ children, ...props }, ref) {
return <DropdownMenuPrimitive.Trigger ref={ref} asChild {...props}>{children}</DropdownMenuPrimitive.Trigger>;
});
export default DropdownMenuTrigger;
