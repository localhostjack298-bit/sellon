import * as React from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full text-left text-[0.84rem]", className)} {...props} />;
}
export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("border-b border-line bg-surface-2/70", className)} {...props} />;
}
export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("whitespace-nowrap px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted", className)} {...props} />;
}
export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("border-b border-line/70 transition-colors last:border-0 hover:bg-surface-2/60", className)} {...props} />;
}
export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle text-fg-2", className)} {...props} />;
}
