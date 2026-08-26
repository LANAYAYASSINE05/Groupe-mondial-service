type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="relative border-b border-gold-soft pb-7">
      <div className="absolute left-0 top-0 h-8 w-px bg-gradient-to-b from-brand to-transparent" />
      <div className="flex flex-wrap items-end justify-between gap-5 pl-4">
        <div className="min-w-0 max-w-2xl">
          <p className="gms-eyebrow">{eyebrow}</p>
          <h1 className="gms-title mt-2 text-balance">{title}</h1>
          {description && <p className="gms-lead mt-3">{description}</p>}
          {meta && <div className="mt-4">{meta}</div>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}
