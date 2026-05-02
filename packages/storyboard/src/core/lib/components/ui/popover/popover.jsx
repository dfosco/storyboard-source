import * as PopoverPrimitive from "@radix-ui/react-popover";
export default function Popover({ children, ...props }) {
return <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>;
}
