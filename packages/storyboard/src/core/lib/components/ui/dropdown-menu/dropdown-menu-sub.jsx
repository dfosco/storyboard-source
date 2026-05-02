import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
export default function DropdownMenuSub({ children, ...props }) {
return <DropdownMenuPrimitive.Sub {...props}>{children}</DropdownMenuPrimitive.Sub>;
}
