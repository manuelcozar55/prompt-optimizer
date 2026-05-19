"use client";
import * as React from "react";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50";
    const variants: Record<Variant, string> = {
      default: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      outline: "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800",
      ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800",
    };
    const sizes: Record<Size, string> = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-6 text-base",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
