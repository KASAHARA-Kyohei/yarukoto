import * as PopoverPrimitive from "@radix-ui/react-popover";
import type * as React from "react";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = ({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      className={cn(
        "z-50 rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-md outline-none",
        className,
      )}
      sideOffset={sideOffset}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverContent, PopoverTrigger };
