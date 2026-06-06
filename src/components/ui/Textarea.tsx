import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-base text-primary outline-none transition placeholder:text-secondary focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
