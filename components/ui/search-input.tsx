import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, icon = true, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Search size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all",
            icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"
