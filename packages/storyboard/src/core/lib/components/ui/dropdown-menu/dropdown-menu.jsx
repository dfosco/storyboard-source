import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
export default function DropdownMenu({ children, ...props }) {
return <DropdownMenuPrimitive.Root {...props}>{children}</DropdownMenuPrimitive.Root>;
}
