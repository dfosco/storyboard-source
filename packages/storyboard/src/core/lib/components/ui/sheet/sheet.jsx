import * as DialogPrimitive from "@radix-ui/react-dialog";
export default function Sheet({ children, ...props }) {
return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}
