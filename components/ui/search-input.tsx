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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">
            <Search size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-surface backdrop-blur-sm border border-line text-ink rounded-xl placeholder:text-ink-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all",
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
