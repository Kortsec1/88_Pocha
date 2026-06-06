import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-lg border border-border bg-surface px-4 text-base text-primary outline-none transition placeholder:text-secondary focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
