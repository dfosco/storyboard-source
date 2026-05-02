import * as SelectPrimitive from "@radix-ui/react-select";
export default function Select({ children, ...props }) {
return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>;
}
