import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn(
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full",
      className
    )}
    {...props}
  />
))
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

const TooltipPortalContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    container?: Element | null
  }
>(({ className, sideOffset = 4, container, ...props }, ref) => {
  const content = (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "fixed z-[var(--layer-tooltip)] pointer-events-none rounded-md bg-black/90 backdrop-blur-sm px-3 py-2 text-xs text-white shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )

  return content
})
TooltipPortalContent.displayName = "TooltipPortalContent"

export { Tooltip, TooltipTrigger, TooltipPortalContent as TooltipContent, TooltipProvider }