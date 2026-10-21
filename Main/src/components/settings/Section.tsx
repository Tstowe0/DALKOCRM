export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border border-[var(--color-blue)]/20 bg-white">
      <div className="bg-[var(--color-blue)] px-4 py-2">
        <h2
          className="text-sm font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
