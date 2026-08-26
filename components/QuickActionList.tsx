import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

export type QuickAction = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function QuickActionList({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="space-y-0 p-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 border-b border-line px-3 py-3.5 text-sm text-mist transition last:border-0 hover:bg-surface/60 hover:text-gold"
          >
            <Icon className="h-4 w-4 shrink-0 text-gold" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
