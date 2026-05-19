"use client";
import * as React from "react";

interface SelectContextValue {
  value: string;
  onValueChange: (v: string) => void;
}
const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`flex h-9 items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function SelectValue() {
  const ctx = React.useContext(SelectContext);
  return <span>{ctx?.value}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  return (
    <select
      value={ctx?.value}
      onChange={(e) => ctx?.onValueChange(e.target.value)}
      className="absolute inset-0 cursor-pointer opacity-0"
      aria-label="domain"
    >
      {children}
    </select>
  );
}

export function SelectItem({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}
