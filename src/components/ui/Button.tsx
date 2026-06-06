import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-accent bg-accent text-white shadow-soft",
        variant === "secondary" && "border-border bg-elevated text-primary",
        variant === "ghost" && "border-transparent bg-transparent text-secondary hover:bg-elevated",
        variant === "danger" && "border-danger bg-danger text-white",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 px-5 text-base",
        size === "icon" && "h-11 w-11 p-0",
        className,
      )}
      {...props}
    />
  );
}
