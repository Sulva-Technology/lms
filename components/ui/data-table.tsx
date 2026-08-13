import * as React from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, keyExtractor, className, onRowClick }: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto glass-panel rounded-2xl", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "p-4 text-sm font-semibold text-slate-400 whitespace-nowrap",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.width
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const rowProps = onRowClick ? { onClick: () => onRowClick(item) } : {};

              return (
              <tr 
                key={keyExtractor(item)} 
                {...rowProps}
                className={cn(
                  "transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
                )}
              >
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={cn(
                      "p-4 text-sm text-slate-300",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.cell(item)}
                  </td>
                ))}
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
