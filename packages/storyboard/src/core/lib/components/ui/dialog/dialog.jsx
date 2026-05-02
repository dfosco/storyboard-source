import * as DialogPrimitive from "@radix-ui/react-dialog";
export default function Dialog({ children, ...props }) {
return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}
