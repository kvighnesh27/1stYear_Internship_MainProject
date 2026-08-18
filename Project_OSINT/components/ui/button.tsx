import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
        {
          "bg-cyan-300 text-slate-950 shadow-glow hover:bg-cyan-200": variant === "primary",
          "border border-cyan-300/25 bg-white/5 text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-300/10": variant === "outline",
          "text-cyan-100 hover:bg-cyan-300/10": variant === "ghost",
          "bg-red-500/15 text-red-100 border border-red-400/35 hover:bg-red-500/25": variant === "danger",
          "h-9 px-3 text-sm": size === "sm",
          "h-11 px-5 text-sm": size === "md",
          "h-12 px-7 text-base": size === "lg",
          "h-10 w-10 p-0": size === "icon"
        },
        className
      )}
      {...props}
    />
  );
}
