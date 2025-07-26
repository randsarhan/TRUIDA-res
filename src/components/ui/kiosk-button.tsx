import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const kioskButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-kiosk hover:shadow-glow",
        success: "bg-gradient-success text-success-foreground shadow-kiosk hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground shadow-kiosk hover:bg-destructive/90",
        outline: "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground shadow-kiosk",
        secondary: "bg-secondary text-secondary-foreground shadow-kiosk hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        kiosk: "bg-gradient-kiosk border-2 border-border text-foreground shadow-kiosk hover:border-primary hover:shadow-glow"
      },
      size: {
        default: "h-14 px-8 py-4",
        sm: "h-10 rounded-md px-6",
        lg: "h-16 rounded-lg px-12 text-xl",
        xl: "h-20 rounded-xl px-16 text-2xl",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface KioskButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof kioskButtonVariants> {
  asChild?: boolean
}

const KioskButton = React.forwardRef<HTMLButtonElement, KioskButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(kioskButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
KioskButton.displayName = "KioskButton"

export { KioskButton, kioskButtonVariants }