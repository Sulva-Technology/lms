import React from "react";
import { PageHeader } from "@/components/ui/page-header";

/**
 * The chrome shared by the list screens. It delegates to PageHeader so a list
 * page and a detail page do not introduce two different headings.
 *
 * `icon` is still accepted because many call sites pass one, but the header no
 * longer renders a decorative tile beside the title.
 */
export function GenericList({ title, description, children, action }: any) {
  return (
    <div>
      <PageHeader title={title} description={description} action={action} />
      <div className="grid gap-5">{children}</div>
    </div>
  );
}
