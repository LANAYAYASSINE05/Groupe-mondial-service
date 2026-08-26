type StatusBadgeProps = {
  tone?: "ok" | "alert" | "mute";
  children: React.ReactNode;
};

export function StatusBadge({ tone = "mute", children }: StatusBadgeProps) {
  const cls =
    tone === "ok"
      ? "gms-badge-ok"
      : tone === "alert"
        ? "gms-badge-alert"
        : "gms-badge-mute";

  return (
    <span className={cls}>
      <span
        className={`h-1.5 w-1.5 shrink-0 ${
          tone === "ok"
            ? "bg-ok"
            : tone === "alert"
              ? "bg-brand"
              : "bg-na"
        }`}
        aria-hidden
      />
      {children}
    </span>
  );
}
