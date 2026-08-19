import React from "react";

export function GenericList({ title, description, children, icon: Icon }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        {Icon && <div className="p-3 bg-primary-soft text-primary rounded-xl"><Icon size={24} /></div>}
        <div>
          <h1 className="font-outfit text-3xl font-bold text-ink">{title}</h1>
          {description && <p className="text-ink-muted">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4">
        {children}
      </div>
    </div>
  );
}
