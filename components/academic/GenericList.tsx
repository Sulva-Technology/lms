import React from "react";

export function GenericList({ title, description, children, icon: Icon }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        {Icon && <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Icon size={24} /></div>}
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">{title}</h1>
          {description && <p className="text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4">
        {children}
      </div>
    </div>
  );
}
