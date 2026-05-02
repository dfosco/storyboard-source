import { forwardRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../../utils/index.js";

const AvatarImage = forwardRef(function AvatarImage({ className, ...props }, ref) {
return (
<AvatarPrimitive.Image
ref={ref}
data-slot="avatar-image"
className={cn("rounded-full aspect-square size-full object-cover", className)}
{...props}
/>
);
});
export default AvatarImage;
