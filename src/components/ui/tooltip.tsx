"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

// Static color map for arrow fill — dynamic class strings are NOT picked up by
// Tailwind JIT, so we resolve the actual CSS color value here instead.
const twBgToColor: Record<string, string> = {
  "bg-primary":   "hsl(var(--primary))",
  "bg-red-400":   "#f87171",
  "bg-red-500":   "#ef4444",
  "bg-red-600":   "#dc2626",
  "bg-red-700":   "#b91c1c",
  "bg-slate-700": "#334155",
  "bg-slate-800": "#1e293b",
  "bg-slate-900": "#0f172a",
  "bg-zinc-800":  "#27272a",
  "bg-zinc-900":  "#18181b",
  "bg-black":     "#000000",
};

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  // Find the first bg-* class in className, then look up the real CSS color.
  const bgClass = className?.split(" ").find((c) => c.startsWith("bg-"));
  const arrowColor = bgClass ? (twBgToColor[bgClass] ?? undefined) : undefined;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
          style={arrowColor ? { fill: arrowColor, background: arrowColor } : undefined}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
