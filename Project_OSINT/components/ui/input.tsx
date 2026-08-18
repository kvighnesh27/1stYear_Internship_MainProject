import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-cyan-300/20 bg-slate-950/70 px-3 text-sm text-cyan-50 outline-none transition",
        "placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20",
        className
      )}
      {...props}
    />
  );
}
