import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

// Use the type directly instead of creating an empty interface
export function Skeleton({ 
  className, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
      {...props}
    />
  );
}