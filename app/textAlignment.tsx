import type { ReactNode } from "react";

export default function GlobalTypographyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        font-sans text-sm contents-font-fix
        [&_h1]:text-xl [&_h1]:font-semibold
        [&_h2]:text-lg [&_h2]:font-semibold
        [&_h3]:text-lg [&_h3]:font-semibold
        [&_th]:text-xs [&_th]:font-semibold
        [&_td]:text-sm
        [&_p]:text-sm
        [&_label]:text-sm
        [&_input]:text-sm
        [&_select]:text-sm
        [&_textarea]:text-sm
        [&_button]:text-sm
      "
    >
      {children}
    </div>
  );
}
