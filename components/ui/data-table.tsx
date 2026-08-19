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
    <div className={cn("w-full overflow-x-auto panel rounded-2xl", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-status-soft">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "p-4 text-sm font-semibold text-ink-muted whitespace-nowrap",
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
        <tbody className="divide-y divide-line">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-ink-subtle text-sm">
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
                  onRowClick ? "cursor-pointer hover:bg-ink/[0.06]" : ""
                )}
              >
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={cn(
                      "p-4 text-sm text-ink-muted",
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
