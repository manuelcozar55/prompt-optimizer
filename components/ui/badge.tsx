import * as React from "react";

export function Badge({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-300 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
